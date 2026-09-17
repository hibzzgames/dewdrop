// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-01-30
//
// Description: This is the primary build script for this website that generates the html and 
//              javascript files
// -------------------------------------------------------------------------------------------------

import { BuildContext } from 'dewdrop/context';
import { HashString } from 'dewdrop/hash';
import { ApplyCss } from 'dewdrop/style';
import { AddWebpageScript, CreateEmptyWebpage } from 'dewdrop/webpage';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { RegisterPages } from 'pages';
import { dirname, resolve } from 'path';
import { Log } from 'dewdrop/shell';

const hydrate_import_path = resolve( 'src/dewdrop/hydrate' );
const context_import_path = resolve( 'src/dewdrop/context' );
const style_import_path   = resolve( 'src/dewdrop/style' );

export type BuildType = "dev" | "prod";
export type CompilePageFn = < T >( route : string, fn : ( ctx : BuildContext, params : T ) => void, params : T ) => void;

// In memory filesystem for dev mode
export interface BuildOutput
{
    build_time : number;
    files : Map< string, string | Uint8Array >;
};

// @Note: Function is async because `Bun.build` returns a promise and I don't know how to handle 
//        that synchronously
export async function Build( mode : BuildType ) : Promise< BuildOutput >
{
    const perf_start = Bun.nanoseconds();
    const build_output : BuildOutput = { build_time: 0, files: new Map< string, string | Uint8Array >() };
    Log.message( "generating website" );

    // Internal function used to compile and save the route to the pages
    function m_compilePage< T = any >( route : string, fn : ( ctx : BuildContext, params : T ) => void, params : T )
    {
        // Create a new a build context
        const ctx : BuildContext = new BuildContext();
        ctx.doc = CreateEmptyWebpage();

        // Add a style tag to the head and store a reference to it in the style data. Components can 
        // manually call ApplyCss to immediately apply the CSS changes, or more realistically, a 
        // pre-rendered components data can be stored here for later extraction
        const style_element = ctx.doc.createElement( 'style' );
        style_element.id = "primary";
        ctx.doc.head.append( style_element );
        ctx.style_data.doc_style = style_element as any;

        // Invoke the given function to gain more information about elements to compile
        fn( ctx, params );

        // Look at the dynamic components needed and generate the dynamic component loader
        if( ctx.dynamic_components.size > 0 )
        {
            const imports : string = Array.from( ctx.dynamic_components, ( [ path, names ] ) => { 
                return `import { ${ Array.from( names ).join( ', ' ) } } from '${ path }';`;
            } ).join( '\n' );

            const component_map_content = Array.from( ctx.dynamic_components.values() ).flatMap( names => { 
                return Array.from( names, name => {
                    return `    [ "${ name }", ${ name } ]`;
                } );
            } ).join( ',\n' );

            const code = `import { Hydrate } from '${ hydrate_import_path }';\n` + 
                         `import { RuntimeContext } from '${ context_import_path }';\n` +
                         `import { InitCachedStyleData } from '${ style_import_path }';\n` +
                         `${ imports }\n\n` +
                         `const dynamic_components = new Map( [\n` +
                         `${ component_map_content }` +
                         `] );\n\n` + 
                         `const ctx = new RuntimeContext();\n`+
                         `ctx.doc = document;\n` +
                         `ctx.style_data.doc_style = document.querySelector( 'style#primary' );\n\n` +
                         `InitCachedStyleData( ctx.style_data );\n\n` +
                         `Hydrate( ctx, dynamic_components )`;

            const code_hash = HashString( code );
            const code_route = `/scripts/${ code_hash }.js`;
            build_output.files.set( code_route, code );

            AddWebpageScript( ctx.doc, code_route, true );
        }

        // In dev mode, inject a script: When the localhost websocket heartbeat is lost, wait for 
        // 300 ms and reload the webpage in the browser. When '--watch' restarts the process as the 
        // source code changes, it'll trigger this behavior improving iteration experience
        if( mode === 'dev' )
        {
            const code_route = '/scripts/dev-reload.js';
            if( !build_output.files.has( code_route ) )
            {
                const code = `const socket = new WebSocket( 'ws://' + location.host );\n` + 
                             `socket.onclose = () => setTimeout( () => location.reload(), 300 );`;
                build_output.files.set( code_route, code );
            }

            AddWebpageScript( ctx.doc, code_route, true );
        }

        // Loop around all in-line styles set by the components, extract them out, and place it in 
        // the added style tag
        ApplyCss( ctx.doc.body, ctx );
        for( const element of Array.from( ctx.doc.body.querySelectorAll( "*" ) ) )
        {
            ApplyCss( element as HTMLElement, ctx );
        }

        build_output.files.set( route, ctx.doc.toString() );
    }

    // Pass the page compiler to website generation function
    RegisterPages( m_compilePage );
    
    // Filter out the javascript files from the build output so that it can be further optimized
    const js_files : Record< string, string > = {}
    const entry_points : string[] = []
    for( const[ path, content] of build_output.files )
    {
        if( path.endsWith( '.js' ) )
        {
            if( typeof content !== 'string' )
            {
                Log.error( `Javascript file at '${ path }' is not a string` );
                continue;
            }
            
            js_files[ path ] = content;
            entry_points.push( path );
        }
    }

    // Delete all the javascript files from the build output because it'll be replaced by the 
    // optimized output by Bun 
    for( const path of entry_points )
    {
        build_output.files.delete( path );
    }

    // Run the bun bundler and grab the optimized outputs
    if( entry_points.length > 0 )
    {
        Log.message( "optimizing scripts" );
        const result = await Bun.build( { 
            entrypoints: entry_points,
            files: js_files,
            target: 'browser',
            format: 'esm',
            minify: mode === 'prod',
            tsconfig: './tsconfig.json',
            define: { BUILD_STEP: JSON.stringify( 'runtime_script' ) }
        } );

        for( const artifact of result.outputs )
        {
            build_output.files.set( artifact.path, await artifact.text() );
        }
    }
    
    // When in production mode, write the information to the disk
    if( mode === 'prod' )
    {
        const output_dir : string = './dist';

        // Delete all contents in the current output directory
        rmSync( output_dir, { recursive: true, force: true } );
        mkdirSync( output_dir, { recursive: true } );

        // Write all files in out build_output map to the disk
        Log.message( "writing files to disk" );
        for( const[ path, content ] of build_output.files )
        {
            const full_path = resolve( `${ output_dir }/${ path }` );
            mkdirSync( dirname( full_path ), { recursive: true } );
            writeFileSync( full_path, content );
        }

        // Copy the contents of the public folder directly into the dist folder
        if( existsSync( './public' ) )
        {
            Log.message( "copying public files" );
            cpSync( './public', output_dir, { recursive: true } );
        }

        // Copy the contents of the asset folder into the dist folder
        // @todo: In the future, we should track the assets used and only copy those items over
        if( existsSync( './assets' ) )
        {
            Log.message( "copying assets" );
            cpSync( './assets', `${ output_dir }/assets`, { recursive: true } );
        }
    }

    const perf_end = Bun.nanoseconds();
    build_output.build_time = ( perf_end - perf_start );

    return build_output;
};

if( import.meta.main )
{
    Log.info( 'Building optimized website', { spacing: 1 } ); 

    const build_output = await Build( 'prod' );

    Log.success( 'Build successful!' );
    Log.message( `build time: ${ build_output.build_time / 1e6 } ms` );
}
