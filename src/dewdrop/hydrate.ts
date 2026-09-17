// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-01-30
//
// Description: This script contains the code for handling hydration of dynamic components
// -------------------------------------------------------------------------------------------------

import { RuntimeContext } from "./context";

export function Hydrate( ctx : RuntimeContext, dynamic_components : Map< string, Function > ) : void
{
    const dynamic_elements = ctx.doc.querySelectorAll( '[data-component]' );
    dynamic_elements.forEach( ( container ) => {
        const component_name = container.getAttribute( 'data-component' );
        const params_str = container.getAttribute( 'data-params' );
        const params = params_str.length > 0 ? JSON.parse( params_str ) : {};

        const dynamic_component = dynamic_components.get( component_name );
        if( dynamic_component ) {
            const new_element = dynamic_component( ctx, params ) as HTMLElement;
            container.replaceWith( new_element );
        }
    } );
}