// -------------------------------------------------------------------------------------------------
// Author:      Sliptrixx (Hibnu Hishath)
// Date:        2026-07-02
//
// Description: This file contains the config information used to customize your dewdrop experience
// -------------------------------------------------------------------------------------------------

/** Custom data available inside both build time and runtime context for components in a page to 
 *  share information and state
 *  @NOTE: The data stored here isn't serialized and cannot be shared between buildtime and runtime 
 *         contexts 
 */
export interface CustomCommonData
{
}

/** Custom data available inside build time context for components in a page to share global 
 *  information and state
 *  @NOTE: The default value is null and the user is responsible for initializing the custom data 
 *         somewhere in the code 
 */
export interface CustomBuildtimeData extends CustomCommonData
{
}

/** Custom data available inside runtime context for components in a page to share global 
 *  information and state
 *  @NOTE: The default value is null and the user is responsible for initializing the custom data 
 *         somewhere in the code 
 */
export interface CustomRuntimeData extends CustomCommonData
{
}
