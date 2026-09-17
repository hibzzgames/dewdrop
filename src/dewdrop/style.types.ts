// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-03-15
//
// Description: This script contains type definition for styles used only in a typescript dev 
//              context
// -------------------------------------------------------------------------------------------------

export type SimplePseudoClass = ":active" | ":active-view-transition" | ":any-link" | ":autofill" | 
                         ":blank" /*(Experimental)*/ | ":buffering" | 
                         ":checked" | ":current" /*(Experimental)*/ |
                         ":default" | ":defined" | ":disabled" |
                         ":empty" | ":enabled" |
                         ":first" | ":first-child" | ":first-of-type" | ":focus" | ":focus-visible" | ":focus-within" | ":fullscreen" | ":future" |
                         ":has-slotted" | ":heading" /*(Experimental)*/ | ":host" | ":hover" |
                         ":in-range" | ":indeterminate" | ":interest-source" /*(Experimental)*/ | ":interest-target" /*(Experimental)*/ | ":invalid" |
                         ":last-child" | ":last-of-type" | ":left" | ":link" | ":local-link" /*(Experimental)*/ |
                         ":modal" | ":muted" |
                         ":only-child" | ":only-of-type" | ":open" | ":optional" | ":out-of-range" |
                         ":past" | ":paused" | ":picture-in-picture" | ":placeholder-shown" | ":playing" | ":popover-open" | 
                         ":read-only" | ":read-write" | ":required" | ":right" | ":root" | 
                         ":scope" | ":seeking" | ":stalled" | 
                         ":target" | ":target-after" | ":target-current" | ":target-before" | 
                         ":user-invalid" | ":user-valid" |
                         ":valid" | ":visited" | ":volume-locked";

export type AdvancedPseudoClass = `:active-view-transition-type(${ string })` | 
                           `:dir(${"ltr" | "rtl"})` | 
                           `:has(${string})` | 
                           `:heading(${string})` /*(Experimental)*/ | 
                           `:host(${string})` | 
                           `:host-context()` | // deprecated
                           `:is(${string})` |
                           `:lang(${string})` |
                           `:not(${string})` |
                           `:nth-child(${string})` |
                           `:nth-last-child(${string})` |
                           `:nth-last-of-type(${string})` |
                           `:nth-of-type(${string})` |
                           `:state(${string})` |
                           `:where(${string})`;

export type PseudoClassType = SimplePseudoClass | AdvancedPseudoClass

export type PseudoStylesMap = Partial< Record< PseudoClassType, Partial< CSSStyleDeclaration > > >;

export type ConditionalAtRules = `@container ${string}` |
                            `@layer ${ string }` |
                            `@media ${ string }` |
                            `@scope ${ string }` |
                            `@starting-style` |
                            `@supports ${ string }`;

export interface AtRuleEntry
{
    style: Partial< CSSStyleDeclaration >;
    pseudoStyles: Record< PseudoClassType, Partial< CSSStyleDeclaration > >;
}

export type AtRulesMap = Partial< Record< ConditionalAtRules, AtRuleEntry > >;

export interface ElementStyle 
{
    style?: Partial< CSSStyleDeclaration >;
    pseudoStyles?: PseudoStylesMap;
    atRules?: AtRulesMap;
}