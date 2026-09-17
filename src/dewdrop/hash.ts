// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-03-31
//
// Description: This script contains functions to hash given content
// -------------------------------------------------------------------------------------------------

/** Hashes the given data into a int32 number using the FNV1A hashing technique
 * 
 *  @param data The string data to hash
 *  @returns The hashed result as a int32 number
 */
export function Hash32( data : string ) : number
{
    // This function uses Fowler-Noll-Vo method to implement fast and simple data hashing
    const FNV_1A_OFFSET : number = 0x811c9dc5;
    const FNV_1A_PRIME  : number = 0x01000193;

    let hash = FNV_1A_OFFSET;
    for( const ch of data )
    {
        // Using imul because 'number' is 64 bit float and can lead to precision errors instead of 
        // overflowing
        hash = hash ^ ch.codePointAt( 0 ) ;
        hash = Math.imul( hash, FNV_1A_PRIME );
    }
    return hash | 0; // forcing the number into 32 bit range
}

/** Hashes the given data into a formatted short string (with lowercase alphabets + digits) using 
 *  FNV1A hashing technique under the hood
 * 
 *  @param data The string data to hash
 *  @returns A hashed short string with lowercase alphabets and digits
 */
export function HashString( data : string ) : string
{
    return ( Hash32( data ) >>> 0 ).toString( 36 );
}