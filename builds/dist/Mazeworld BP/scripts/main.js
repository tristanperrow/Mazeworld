import * as server from "@minecraft/server"
import * as Mazeworld from "./Mazeworld"

/* 
 *
 * This script is to start Mazeworld.ts.
 * 
 * You cannot start minecraft BP scripting in a typescript file, so I had to make a main.js file to initialize it.
 * The typescript file does not have to be statically typed, but for some reason it allows for the imports to work correctly.
 * This means that this is here so that way the JSDoc works in Mazeworld.ts (which is basically just a JS file).
 * 
 * This is for future me & spencer so we don't get confused why this file exists.
 * 
 */