// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-03-15
//
// Description: This script contains the code to manage runtime/build-time css style sheet rules 
//              generation and manipulation
// -------------------------------------------------------------------------------------------------

import type { HTMLStyleElement } from "linkedom";
import { type DewdropContext } from "./context";
import { Hash32, HashString } from "./hash";
import type { AtRuleEntry, AtRulesMap, ConditionalAtRules, PseudoClassType, PseudoStylesMap } from "./style.types";

export interface StyleRule
{
    // The serialized version of style declaration for faster writes
    content : string;

    // A list of selectors to who the rule should apply
    selectors : Set< string >;

    // The style declaration for quick access of style information
    style : Partial< CSSStyleDeclaration >;
}

export interface AtStyleRule
{
    // The condition of the at rule including the '@' symbol
    condition : ConditionalAtRules;

    // A list of rules with their selectors, where the key is the hash of the rule
    rules : Map< number, StyleRule >;
}

export interface StyleData
{
    // Reference to the style tag in the document
    doc_style : HTMLStyleElement;

    // A list of rules with their selectors, where the key is the hash of the rule
    rules : Map< number, StyleRule >;

    // A list of at rules where the key is the hash of the condition 
    at_rules : Map< number, AtStyleRule >;

    // For faster lookup instead of iterating through the map
    registered_classes : Set< string >;
}

// Convert kebab to camel case
// Based on this github gist by dtomasi (https://gist.github.com/dtomasi/9327f704398be8d8ff5d0ab560b95641)
const toCamel = ( str : string ) => str.replace( /-([a-z])/g, function ( f ) { return f[1].toUpperCase(); } );

// Convert camel to kebab case 
// Based on this github gist by dtomasi (https://gist.github.com/dtomasi/9327f704398be8d8ff5d0ab560b95641)
const toKebab = ( str : string ) => str.replace( /([a-z])([A-Z])/g, '$1-$2' ).toLowerCase();

function CopyStyle( style : Partial< CSSStyleDeclaration > ) : Partial< CSSStyleDeclaration >
{
    const copy : Partial< CSSStyleDeclaration > = {};
    
    // Is this a special object coming from the DOM? Then it needs a different approach to iterate 
    // the style information and a simple for...in loop will not work
    if( typeof style.length === 'number' && typeof style.getPropertyValue === 'function' )
    {
        for( let i = 0; i < style.length; i++ )
        {
            const prop = style[ i ];
            copy[ toCamel( prop ) ] = style.getPropertyValue( prop );
        }
    }

    // Or is this a plain old simple javascript object?
    else
    {
        for( const key in style )
        {
            copy[ key ] = style[ key ];
        }
    }

    return copy;
}

function ParseCssText( css_text : string ) : Partial< CSSStyleDeclaration >
{
    const parsed : Partial< CSSStyleDeclaration > = {};
    for( const statement of css_text.split( ';' ) )
    {
        const trimmed = statement.trim();
        if( trimmed.length <= 0 ) { continue; }

        const colon_idx = trimmed.indexOf( ':' );
        if( colon_idx < 0 ) { continue; }

        const prop = trimmed.slice( 0, colon_idx ).trim();
        const value = trimmed.slice( colon_idx + 1 ).trim();
        if( prop.length <= 0 || value.length <= 0 ) { continue; }

        parsed[ toCamel( prop ) ] = value;
    }
    return parsed;
}

function MergeStyle( target : Partial< CSSStyleDeclaration >, source : Partial< CSSStyleDeclaration > )
{
    const source_copy = CopyStyle( source );
    const is_target_in_dom = typeof target.getPropertyValue === 'function';

    for( const [ prop, value ] of Object.entries( source_copy ) )
    {
        if( is_target_in_dom )
        {
            const kebab_prop = toKebab( prop );
            if( target.getPropertyValue( kebab_prop ) === '' )
            {
                target.setProperty( kebab_prop, value as string );
            }
        }
        else
        {
            if( target[ prop ] === undefined )
            {
                target[ prop ] = value;
            }
        }
    }
}

export function SetupPseudoStyles( element : { pseudoStyles : PseudoStylesMap }, styles : PseudoClassType[] ) : void 
{
    // Ensure that a valid element is provided
    if( element && styles.length > 0 )
    {
        // If the pseudo styles variable doesn't exist yet, assign a new one
        if( element.pseudoStyles === undefined )
        {
            element.pseudoStyles = {} as PseudoStylesMap;
        }

        // For each given style that doesn't exist yet, add a new CssStyleDeclaration
        for( const style of styles )
        {
            if( element.pseudoStyles[ style ] === undefined )
            {
                element.pseudoStyles[ style ] = {} as Partial< CSSStyleDeclaration >;
            }
        }
    }
}

export function SetupAtRules( element : { atRules : AtRulesMap }, rules : ConditionalAtRules[] ) : void
{
    // Ensure that a valid element is provided
    if( element && rules.length > 0 )
    {
        // If the 'at rules' map hasn't been initialized, set it up first
        if( element.atRules === undefined )
        {
            element.atRules = {} as AtRulesMap;
        }

        // Setup the at-rule entry and the base style property. Intentionally not setting up the 
        // pseudoStyles property here and deferring its setup tp `SetupPseudoStyles` function 
        for( const rule of rules )
        {
            if( element.atRules[ rule ] === undefined )
            {
                element.atRules[ rule ] = { } as AtRuleEntry;
                element.atRules[ rule ].style = { } as Partial< CSSStyleDeclaration >;
            }
        }
    }
}

export function ApplyCss( element : HTMLElement, ctx : DewdropContext ) : void
{
    // Get a reference to the different style data structures inside ctx so that I don't have to 
    // repeat type ctx.style_data.** over and over again
    const doc_style = ctx.style_data.doc_style;
    const registered_classes = ctx.style_data.registered_classes;
    const style_rules = ctx.style_data.rules;
    const at_style_rules = ctx.style_data.at_rules;

    // Get the element's current class name and check if it's a registered class in dewdrop's style 
    // system. If yes, we're going to temporarily copy the contents over to the element and 
    // reprocess it.
    if( registered_classes.has( element.className ) )
    {
        const class_name = element.className;

        // A class can appear as a simple selector and/or with pseudoclass appended to the end, so 
        // we can't just break out of the loop once found and instead we should loop through 
        // everything
        for( const style_rule of style_rules.values() )
        {
            for( const selector of style_rule.selectors )
            {
                if( selector === class_name )
                {
                    MergeStyle( element.style, style_rule.style );
                }
                else if( selector.startsWith( class_name ) && selector[ class_name.length ] === ':' )
                {
                    const pseudo_class = selector.slice( class_name.length );
                    SetupPseudoStyles( element, [ pseudo_class as PseudoClassType ] );
                    MergeStyle( element.pseudoStyles[ pseudo_class ], style_rule.style );
                }
            }
        }

        // Same idea as above, but we need to go a level deeper because each at-rule has it's own 
        // map of base + pseudoclass selectors
        for( const at_rule of at_style_rules.values() )
        {
            for( const style_rule of at_rule.rules.values() )
            {
                for( const selector of style_rule.selectors )
                {
                    if( selector === class_name )
                    {
                        SetupAtRules( element, [ at_rule.condition ] );
                        MergeStyle( element.atRules[ at_rule.condition ].style, style_rule.style );
                    }
                    else if( selector.startsWith( class_name ) && selector[ class_name.length ] === ':' )
                    {
                        const pseudo_class = selector.slice( class_name.length );
                        SetupAtRules( element, [ at_rule.condition ] );
                        SetupPseudoStyles( element.atRules[ at_rule.condition ], [ pseudo_class as PseudoClassType ] );
                        MergeStyle( element.atRules[ at_rule.condition ].pseudoStyles[ pseudo_class ], style_rule.style );
                    }
                }
            }
        }
    }

    // Figure a combined content of base style and any and all custom pseudo class styles to figure 
    // out a unique hash that'll fit this combination of style for this element
    let combined_content_string = "";
    if( element.style.length > 0 )
    {
        combined_content_string += `base:{${ element.style.cssText }}`;
    }

    if( element.pseudoStyles !== undefined )
    {
        combined_content_string += JSON.stringify( element.pseudoStyles );
    }

    if( element.atRules !== undefined )
    {
        combined_content_string += JSON.stringify( element.atRules );
    }

    if( combined_content_string.length > 0 )
    {
        // Hash the combined content to get a short string that can be used as class name
        const class_name = `s${ HashString( combined_content_string ) }`;
        
        // See if we have already registered this class name, if not we can update the css with the 
        // right rules
        if( !registered_classes.has( class_name ) )
        {
            // If there's a base style defined, add it to the list of selectors for that rule. The 
            // key is based on the rule's hash32 number for faster lookup. If a rule isn't available 
            // yet, set the structure up and add the class to it
            if( element.style.length > 0 )
            {
                const content = element.style.cssText;
                const content_hash_32 = Hash32( content );
                if( !style_rules.has( content_hash_32 ) )
                {
                    style_rules.set( content_hash_32, { content: content, selectors: new Set< string >(), style: CopyStyle( element.style ) } );
                }
                style_rules.get( content_hash_32 ).selectors.add( class_name );
            }

            // Do a similar process to the above base style, except we have to build the rule from 
            // the data available. Our custom pseudo-class rules don't have a functional cssText 
            // property like the dom backed base style. So we have to convert the camel case key 
            // values to kebab-case that css wants and format it
            if( element.pseudoStyles !== undefined )
            {
                for( const [ pseudo_class, style ] of Object.entries( element.pseudoStyles ) )
                {
                    const selector = `${ class_name }${ pseudo_class }`;
                    const content = Object.entries( style ).map( ( [ prop, value ] ) => `${ toKebab( prop ) }:${ value }` ).join( "; " );
                    const content_hash_32 = Hash32( content );
                    if( !style_rules.has( content_hash_32 ) )
                    {
                        style_rules.set( content_hash_32, { content: content, selectors: new Set< string >(), style: CopyStyle( style ) } );
                    }
                    style_rules.get( content_hash_32 ).selectors.add( selector );
                }
            }

            // Very similar to the process above, but we need to do the two above steps for each 
            // defined at rule. In this case, both the base style and pseudoclass styles inside an 
            // at-rule needs to be formatted by ourself
            if( element.atRules !== undefined )
            {
                for( const [ condition, atRule ] of Object.entries( element.atRules ) )
                {
                    const condition_hash = Hash32( condition );
                    if( !at_style_rules.has( condition_hash ) )
                    {
                        at_style_rules.set( condition_hash, { condition: condition as ConditionalAtRules, rules: new Map< number, StyleRule >() } );
                    }
                    const at_style_rule = at_style_rules.get( condition_hash );

                    // Extract base style information
                    const base_entries = Object.entries( atRule.style );
                    if( base_entries.length > 0 )
                    {
                        const content = base_entries.map( ( [ prop, value ] ) => `${ toKebab( prop ) }:${ value }` ).join( "; " );
                        const content_hash = Hash32( content );
                        if( !at_style_rule.rules.has( content_hash ) )
                        {
                            at_style_rule.rules.set( content_hash, { content: content, selectors: new Set< string >(), style: CopyStyle( atRule.style ) } );
                        }
                        at_style_rule.rules.get( content_hash ).selectors.add( class_name );
                    }

                    // Extract the pseudo style inside the at-rule
                    if( atRule.pseudoStyles !== undefined )
                    {
                        for( const [ pseudo_class, style ] of Object.entries( atRule.pseudoStyles ) )
                        {
                            const selector = `${ class_name }${ pseudo_class }`;
                            const content = Object.entries( style ).map( ( [ prop, value ] ) => `${ toKebab( prop ) }:${ value }` ).join( "; " );
                            const content_hash = Hash32( content );
                            if( !at_style_rule.rules.has( content_hash ) )
                            {
                                at_style_rule.rules.set( content_hash, { content: content, selectors: new Set< string >(), style: CopyStyle( style ) } );
                            }
                            at_style_rule.rules.get( content_hash ).selectors.add( selector );
                        }
                    }
                }
            }

            // Add the class name as a registered class to the cached set so that we don't have to 
            // rebuild rules and shortcut that step
            registered_classes.add( class_name );

            // Finally, update the css content in the given style element. Not being smart and 
            // rebuilding the entire css from memory instead of update specific rules with the new 
            // selectors. Maybe that's a project for the future if I want to further optimize it.
            const base_css = Array.from( style_rules.values() ).map( rule => `${ [ ...rule.selectors ].map( selector => `.${ selector }` ).join( ", " ) } { ${ rule.content } }` ).join( '\n' );

            // Doing the same, but with the at rules, where each at rule is nested with the css 
            // content similar to above
            const at_css = Array.from( at_style_rules.values() ).map( at_rule => { 
                const inner_text = Array.from( at_rule.rules.values() ).map( rule => `${ [ ...rule.selectors ].map( selector => `.${ selector }` ).join( ", " ) } { ${ rule.content } }` ).join( '\n' );
                return `${ at_rule.condition } { \n${ inner_text } \n}`;
            } ).join( '\n' );

            // Handy formatting snippet where we only add a line break if there's text content when 
            // appending strings. Also, kinda important to note that we're replacing the entire text 
            // content here because of linkedom limitations. Linkedom hasn't implemented any of the 
            // stylesheet rules API so updating those values doesn't get reflected in the baked out 
            // html files.
            const css_text = [ base_css, at_css ].filter( text => text.length > 0 ).join( '\n' );
            doc_style.textContent = css_text;
        }

        // All the data has been read and applied to the css, update the class information and 
        // remove all style data 
        element.className = class_name;
        element.removeAttribute( 'style' );
        if( element.pseudoStyles !== undefined ) { delete element.pseudoStyles; }
        if( element.atRules !== undefined ) { delete element.atRules; }
    }
}

export function InitCachedStyleData( style_data : StyleData ) : void
{
    // clear out existing data
    style_data.registered_classes.clear();
    style_data.rules.clear();
    style_data.at_rules.clear();

    // If a style sheet exists
    const sheet = style_data.doc_style.sheet as CSSStyleSheet;
    if( sheet )
    {
        const m_parseRuleFn = ( rule : CSSStyleRule, target_rules : Map< number, StyleRule > ) => 
        {
            const selectors = new Set< string >( rule.selectorText.split( "," ).map( s => s.substring( s.indexOf( '.' ) + 1 ).trim() ).filter( s => s.length > 0 ) );
            const content = rule.cssText.substring( rule.cssText.indexOf( '{' ) + 1, rule.cssText.lastIndexOf( '}' ) ).trim().replace( /;$/, "" );
            const content_hash = Hash32( content );
            target_rules.set( content_hash, { content: content, selectors: selectors, style: ParseCssText( content ) } );
            for( const selector of selectors )
            {
                const colon_idx = selector.indexOf( ':' );
                const class_name = colon_idx >= 0 ? selector.substring( 0, colon_idx ) : selector;
                style_data.registered_classes.add( class_name );
            }
        };

        for( let i = 0; i < sheet.cssRules.length; i++ )
        {
            const rule = sheet.cssRules[ i ] as CSSStyleRule;
            if( rule.cssText.startsWith( '@' ) ) // At-Rule
            {
                const condition = rule.cssText.substring( 0, rule.cssText.indexOf( '{' ) ).trim();
                const condition_hash = Hash32( condition );
                if( !style_data.at_rules.has( condition_hash ) )
                {
                    style_data.at_rules.set( condition_hash, { condition: condition as ConditionalAtRules, rules: new Map< number, StyleRule >() } );
                }
                for( let j = 0; j < rule.cssRules.length; j++ )
                {
                    const innerRule = rule.cssRules[ j ] as CSSStyleRule; 
                    m_parseRuleFn( innerRule, style_data.at_rules.get( condition_hash ).rules );
                }
            }
            else // Other basic rules
            {
                m_parseRuleFn( rule, style_data.rules );
            }
        }
    }
}

