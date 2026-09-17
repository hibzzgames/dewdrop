// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-03-12
//
// Description: A bunch of utilities that make the TUI experience nicer
// -------------------------------------------------------------------------------------------------

import { log as ClackLog, type LogMessageOptions } from '@clack/prompts';

export const ANSI_RESET   : string = '\x1b[0m';
export const ANSI_BOLD    : string = '\x1b[1m';
export const ANSI_DIM     : string = '\x1b[2m';

export const ANSI_MOVE_UP    = ( line_count : number )   => `\x1b[${ line_count }A`;
export const ANSI_MOVE_DOWN  = ( line_count : number )   => `\x1b[${ line_count }B`;
export const ANSI_MOVE_RIGHT = ( column_count : number ) => `\x1b[${ column_count }C`;
export const ANSI_MOVE_LEFT  = ( column_count : number ) => `\x1b[${ column_count }D`;

export const ANSI_ERASE_TO_END : string = `\x1b[K`;
export const ANSI_ERASE_TO_START : string = `\x1b[1K`;
export const ANSI_ERASE_LINE : string = `\x1b[2K`;

// I really wanted to use Bun.Color( 'magenta', ansi ), but for some reason the color wasn't right 
// at all
const ANSI_MAGENTA : string = '\x1b[35m';

const LOG_DEFAULTS : LogMessageOptions = { spacing: 0 };

export const Log = {
    message: ( msg : string, opts? : LogMessageOptions ) => ClackLog.message( ANSI_DIM + msg + ANSI_RESET, { ...LOG_DEFAULTS, ...opts } ),
    info: ( msg : string, opts? : LogMessageOptions ) => ClackLog.info( msg, { ...LOG_DEFAULTS, ...opts } ),
    warn: ( msg : string, opts? : LogMessageOptions ) => ClackLog.warn( msg, { ...LOG_DEFAULTS, ...opts } ),
    error: ( msg : string, opts? : LogMessageOptions ) => ClackLog.error( msg, { ...LOG_DEFAULTS, ...opts } ),
    success: ( msg : string, opts? : LogMessageOptions ) => ClackLog.success( msg, { ...LOG_DEFAULTS, ...opts } ),
    step: ( msg : string, opts? : LogMessageOptions ) => ClackLog.step( msg, { ...LOG_DEFAULTS, ...opts } ),
};

export function $( cmd : TemplateStringsArray ) : Bun.$.ShellPromise
{
    Log.message( "" );
    console.log( `${ ANSI_RESET }${ ANSI_DIM }${ ANSI_MAGENTA }$${ ANSI_RESET }${ ANSI_DIM }${ ANSI_BOLD } ${ cmd }${ ANSI_RESET }` );
    return Bun.$( cmd );
}

export async function* Input() : AsyncGenerator< string >
{
    for await( const line of console )
    {
        const input = line.trim();
        process.stdout.write( ANSI_MOVE_UP( 1 ) + ANSI_ERASE_LINE );
        Log.message( `> ${ input }` );

        yield input;
    }
}