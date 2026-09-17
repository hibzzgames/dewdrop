// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-05-17
//
// Description: This script contains the definition of dewdrop contexts for BuildTime and 
//              RuntimeContexts used to share state and metadata information to the build system or 
//              other components using the dewdrop framework
// -------------------------------------------------------------------------------------------------

import type { CustomBuildtimeData, CustomCommonData, CustomRuntimeData } from "config";
import type { AtStyleRule, StyleData, StyleRule } from "./style";

/** The common interface shared by the dewdrop contexts */
export interface DewdropContext
{
    doc : Document;
    style_data : StyleData;
    custom_data : CustomCommonData;
}

/** The buildtime specific context */
export class BuildContext implements DewdropContext
{
    doc : Document = null;
    style_data : StyleData = { 
         doc_style : null, 
         registered_classes : new Set< string >(),
         rules : new Map< number, StyleRule >(),
         at_rules : new Map< number, AtStyleRule >(),
     };
    
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

    custom_data : CustomBuildtimeData = null;
};

/** The runtime specific context */
export class RuntimeContext implements DewdropContext
{
    doc : Document = null;
    
    style_data : StyleData = { 
        doc_style : null, 
        registered_classes : new Set< string >(),
        rules : new Map< number, StyleRule >(),
        at_rules : new Map< number, AtStyleRule >(),
    };

    custom_data : CustomRuntimeData = null;
}

