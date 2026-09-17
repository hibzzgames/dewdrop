// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-01-30
//
// Description: This script contains the code for the abstract Component that every custom component 
//              should extend
// -------------------------------------------------------------------------------------------------

import { BuildContext, type DewdropContext } from "./context";

/** The type of component */
export type ComponentType = 'Dynamic' | 'Static';

/** The function prototype for any component renderer */
export type ComponentRenderer< T = any > = ( ctx : DewdropContext, params : T ) => HTMLElement;

/** Used to actually define the dynamic component */
function m_DynamicComponent< T = any >( ctx : DewdropContext, importPath : string, renderer : ComponentRenderer< T >, params : T ) : HTMLElement
{
    if( ctx instanceof BuildContext )
    {
        // Start tracking this dynamic component
        ctx.TrackDynamicComponent( importPath, renderer.name );

        // And return a placeholder div with the name of the renderer and serialized params so that 
        // dewdrop can reconstruct the call at runtime
        const component_container = ctx.doc.createElement( 'div' );
        component_container.setAttribute( 'data-component', renderer.name );
        component_container.setAttribute( 'data-params', JSON.stringify( params ) );
        return component_container;
    }
    
    // I'm not sure what should happen if a user calls a define dynamic component at runtime. That's 
    // kind of an undefined behavior that I didn't anticipate
    throw new Error( "Function `m_DynamicComponent` cannot be called on a non-build time context" );
}

/** Used to define a new dynamic component. The function specified in the renderer field will be 
 *  called at runtime. */
export function DynamicComponent< T >( importPath : string, renderer : ComponentRenderer< T > ) : ComponentRenderer< T >
{
    return ( ctx : DewdropContext, params : T ) => m_DynamicComponent< T >( ctx, importPath, renderer, params );
}
