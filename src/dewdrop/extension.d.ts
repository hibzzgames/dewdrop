// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-03-21
//
// Description: This script contains global declarations to extend existing objects for dev purpose 
//              via intellisense
// -------------------------------------------------------------------------------------------------

import { type AtRulesMap, type PseudoStylesMap } from "./style.types";

declare global 
{
    /** The build step we're currently in
     *  - page: Building a webpage at the moment
     *  - runtime_script: Building the runtime script that'll be attached to the browser
     *  - undefined: The variable hasn't been defined, so likely we're in the browser. Hopefully 
     *               tree shaking works and we never encounter this in the final built runtime 
     *               script
     */
    declare const BUILD_STEP : 'page' | 'runtime_script' | undefined;
    
    interface HTMLElement 
    {
        // A record of a css pseudo classes and style declarations
        pseudoStyles : PseudoStylesMap;

        // A list of conditional at-rules to apply to this element
        atRules : AtRulesMap;
    }
}
