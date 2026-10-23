// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-05-17
//
// Description: This script contains the definition of dewdrop contexts for BuildTime and 
//              RuntimeContexts used to share state and metadata information to the build system or 
//              other components using the dewdrop framework
// -------------------------------------------------------------------------------------------------

import type { AtStyleRule, StyleData, StyleRule } from "./style";

/** The common interface shared by the dewdrop contexts */
export class DewdropContext
{
    doc : Document          = null;
    style_data : StyleData  = {
        doc_style: null,
        registered_classes: new Set< string >(),
        rules: new Map< number, StyleRule >(),
        at_rules: new Map< number, AtStyleRule >()
    };
}

/** The default build-time specific context */
export class BuildContext extends DewdropContext
{
    dynamic_components : Map< string /* import_path */, Set< string /* component_name */ > > = new Map< string, Set< string > >();

    TrackDynamicComponent( import_path : string, component_name : string ) : void
    {
        let component_names = this.dynamic_components.get( import_path );
        if( !component_names )
        {
            component_names = new Set();
            this.dynamic_components.set( import_path, component_names );
        }
        component_names.add( component_name );
    }
};

/** The default runtime specific context */
export class RuntimeContext extends DewdropContext
{
}

/** An interface that can be provided to the define the BuildContext and RuntimeContext to use */
export interface ContextConfig< B extends BuildContext = BuildContext, R extends RuntimeContext = RuntimeContext >
{
    build? : new () => B;
    runtime? : {
        ctor: new () => R;
        import_path : string;
    }
}
