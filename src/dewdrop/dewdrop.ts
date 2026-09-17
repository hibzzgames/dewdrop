// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-07-09
//
// Description: The primary tool to interact with the dewdrop framework
// -------------------------------------------------------------------------------------------------

/** Imports */
import { intro, isCancel, outro, select } from "@clack/prompts";
import { RegisterCommands } from "commands";
import { $, Log } from "dewdrop/shell";

export interface Command
{
    name      : string;
    hint?     : string;
    options?  : Command[];
    action?   : () => Promise< void > | void;
    alias_of? : string;
    hidden?   : boolean;
};

async function Pick( message : string, commands : Command[] ) : Promise< Command >
{
    const visible_commands = commands.filter( c => !c.hidden );
    const value = await select( { message: message, options: visible_commands.map( c => ( { value: c.name, hint: c.hint } ) ) } );
    if( isCancel( value ) )
    {
        Log.error( "operation cancelled" );
        process.exit( 1 );
    }
    return visible_commands.find( c => c.name === value );
}

async function Resolve( commands : Command[], args : string[], parent_name? : string ) : Promise< Command >
{
    const matched = args[ 0 ] ? commands.find( c => c.name === args[ 0 ] ) : undefined;
    const command = matched ?? await Pick( parent_name ? `select ${ parent_name } option` : "select operation", commands );

    if( command.alias_of )
    {
        return Resolve( root_commands, command.alias_of.split( ' ' ) );
    }

    if( command.options?.length )
    {
        return Resolve( command.options, matched ? args.slice( 1 ) : [], command.name );
    }

    return command;
}

// Default list of commands to interact with the dewdrop framework
const dewdrop_commands : Command[] = [
    {
        name: 'run',
        hint: 'with modes like build/debug/dev',
        options: [
            {
                name: 'build',
                hint: 'optimized build written to /dist',
                action: async () => 
                { 
                    await $`bun run --define "BUILD_STEP='page'" src/dewdrop/build.ts` 
                }
            },
            {
                name: 'debug',
                hint: 'build with breakpoint injected in the first line on the script',
                action: async () => 
                {
                    await $`bun run --watch --inspect-brk --define "BUILD_STEP='page'" src/dewdrop/dev.ts`
                }
            },
            {
                name: 'dev',
                hint: 'build hosted locally that watches and refreshes on saved changes',
                action: async () =>
                {
                    await $`bun run --watch --define "BUILD_STEP='page'" src/dewdrop/dev.ts`
                }
            }
        ]
    },
    { name: 'build', hidden: true, alias_of: 'run build' },
    { name: 'debug', hidden: true, alias_of: 'run debug' },
    { name: 'dev',   hidden: true, alias_of: 'run dev'   },
];

// Merge it with the custom user commands
const root_commands : Command[] = [ ...dewdrop_commands, ...RegisterCommands() ];

/** Actual implementation */
intro( "(dewdrop)" );

const command = await Resolve( root_commands, Bun.argv.slice( 2 ) );
if( command && command.action )
{
    await command.action();
}

outro( "done!" );