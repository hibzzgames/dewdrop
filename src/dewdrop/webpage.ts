// -------------------------------------------------------------------------------------------------
// Author:      sliptrixx (Hibnu Hishath)
// Date:        2026-01-30
//
// Description: This script is used to quickly a generate a html page and contains functions to 
//              manipulate the document
// -------------------------------------------------------------------------------------------------

import { parseHTML } from "linkedom";

export function CreateEmptyWebpage() : Document
{
    const document = parseHTML( '<!DOCTYPE html><html><body></body></html>' ).document;
    return document;
}

export function UpdateWebpageIcon( document : Document, icon : string ) : void
{
    const existing_link = document.head.querySelector( 'link[rel="icon"]' ) as HTMLLinkElement;
    if( existing_link )
    {
        existing_link.href = icon;
        existing_link.type = Bun.file( icon ).type;
    }
    else
    {
        const link = document.createElement( 'link' );
        link.rel = 'icon';
        link.href = icon;
        link.type = Bun.file( icon ).type;
        document.head.append( link );
    }
}

export function AddWebpageScript( document : Document, script : string, defer : boolean ) : void
{
    const script_element = document.createElement( 'script' );
    script_element.src = script;
    script_element.defer = defer;
    document.head.append( script_element );
}

export function RemoveWebpageScript( document : Document, script : string ) : boolean
{
    const script_element = document.head.querySelector( `script[src="${ script }"]` );
    if( script_element )
    {
        script_element.remove();
        return true;
    }
    return false;
}

export function AddWebpageFont( document : Document, font_name : string, font_source : string ) : void
{
    // Get the style element with the id 'fonts', if not, create a new one
    let font_style_element : HTMLStyleElement = document.head.querySelector( 'style#fonts' );
    if( !font_style_element )
    {
        font_style_element = document.createElement( 'style' );
        font_style_element.id = "fonts";
        document.head.append( font_style_element );
    }

    // Check if the font to be added already exists
    const current_css = font_style_element.textContent;
    if( current_css.includes( `font-family: '${ font_name }'` ) )
    {
        return;
    }

    const new_rule = `@font-face {
        font-family: '${ font_name }';
        src: url('${ font_source }') format('woff2');
        font-display: swap;
    }\n`;
    
    font_style_element.textContent = current_css + new_rule;
}

export function UpdateWebpageCharset( document : Document, charset : string = 'utf-8' ) : void
{
    let meta = document.head.querySelector( 'meta[charset]' ) as HTMLMetaElement;
    if( !meta )
    {
        meta = document.createElement( 'meta' );
        document.head.append( meta );
    }
    meta.setAttribute( 'charset', charset );
}

export function AddWebpageMetaTag( document : Document, name : string, content : string ) : void
{
    const meta = document.createElement( 'meta' );
    meta.name = name;
    meta.content = content;
    document.head.append( meta );
}

export function EnableMobileViewport( document : Document )
{
    AddWebpageMetaTag( document, 'viewport', 'width=device-width, initial-scale=1.0' );
}
