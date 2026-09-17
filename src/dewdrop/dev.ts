// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-01-30
//
// Description: This is the script ran to run the website in a local server for development and 
//              debugging purposes
// -------------------------------------------------------------------------------------------------

import { watch } from "fs";
import { Input, Log } from "dewdrop/shell";
import { Build, type BuildOutput } from "dewdrop/build";

// Run the build script on script run
Log.info( `Building dev server`, { spacing: 1 } );
let build_output : BuildOutput = await Build( 'dev' );

// Add a message on how long it took to build the server
Log.message( `Build took ${ build_output.build_time / 1e6 } ms` );

// Watch relevant folders for any changes and if any change occurs, rerun the build script
// @Note: No longer watching the src folder because we're running bun with the '--watch' flag and 
//        deeply nested includes will automatically trigger the Bun process to restart. This is 
//        needed because of ESM modules being cached and not being updated by the Bun process. And 
//        because this issue is only for ESM modules, I'm still watching the 'content' folder for 
//        changes to other data like the markdown files.
watch( './content', { recursive: true }, async () => { build_output = await Build( 'dev' ) } );

// Get a list of all candidates for a given url to mimic the cloudflare hosting behavior, where 
// website.com/page.html and website.com/page/ both redirect to website.com/page
function resolveCandidates( pathname : string ) : string[]
{
    if( pathname === '/' )
    {
        return [ '/index.html' ]
    }
    else if( pathname.endsWith( '.html' ) )
    {
        return [ pathname ];
    }
    else if( pathname.endsWith( '/' ) )
    {
        return [ pathname, `${ pathname }/index.html`, `${ pathname.substring( 0, pathname.length - 1 ) }.html` ];
    }

    return [ pathname, `${ pathname }.html`, `${ pathname }/index.html` ];
}

// Serve the files using Bun's serve script with hot module replacement
Log.info( 'Launching dev server' );
Bun.serve( { 
    port: 3000,
    development: true,
    async fetch( req, server ) 
    {
        // Upgrade an incoming request to a websocket to support auto webpage reloading. If this 
        // fails, continue with the standard logic
        if( server.upgrade( req ) ) { return undefined; }

        // Get the url and evaluate the candidates
        const url = new URL( req.url );
        const candidates = resolveCandidates( url.pathname );

        // Serve the content available at the path
        for( const candidate of candidates )
        {
            const content = build_output.files.get( candidate.slice( 1 ) );
            if( content )
            {
                return new Response( content as BodyInit, { headers: { 'Content-Type': Bun.file( candidate ).type } } );
            }
        }

        // If the path starts with /assets, check if the file exists in the assets folder and serve 
        // it directly from here
        // @Note: In the future when there's asset tracking, we should only serve assets that are 
        //        being tracked and warn about untracked assets being requested
        if( url.pathname.startsWith( '/assets/' ) )
        {
            const file = Bun.file( `.${ url.pathname }`);
            return file.exists() ? new Response( file ) : new Response( '404', { status: 404 } );
        }

        // Final fallback to the public folder
        for( const candidate of candidates )
        {
            const file = Bun.file( `./public${ candidate }` );
            if( await file.exists() )
            {
                new Response( file );
            }
        }

        // None found, return 404
        return new Response( '404', { status: 404 } );
    },
    websocket:
    {
        message() {}, // heartbeat to reload the webpage
    },
} );

// Final helper output displaying where the content is being hosted
Log.success( "Dev server running @ http://localhost:3000" );

// Add a helper to safely quit the program when user presses 'q'. The user can always press ctrl+c 
// to abort the program but this lets the program safely exit and return back to the orchestrator, 
// if spawned by an external script
Log.step( 'press q + enter to quit' );
for await( const input of Input() )
{
    if( input.toLowerCase() === 'q' )
    {
        Log.info( 'Stopping dev server' );
        process.exit( 0 );
    }
}

