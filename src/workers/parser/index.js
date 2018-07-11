/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

// @flow

import { workerUtils } from "devtools-utils";
const { WorkerDispatcher } = workerUtils;

import type { AstLocation, AstPosition, PausePoints } from "./types";
import type { Location, Source, SourceId } from "../../types";
import type { SourceScope } from "./getScopes/visitor";
import type { SymbolDeclarations } from "./getSymbols";

export type Task = (...rest: Array<any>) => Promise<any>;

type Dispatcher = {
  start: (path: string) => void,
  stop: () => void,
  task: (workerName: string) => Task
};

const dispatcher: Dispatcher = new WorkerDispatcher();
export const start = dispatcher.start.bind(dispatcher);
export const stop = dispatcher.stop.bind(dispatcher);

export const findOutOfScopeLocations = ((dispatcher.task(
  "findOutOfScopeLocations"
): any): (sourceId: string, position: AstPosition) => Promise<AstLocation[]>);

export const getNextStep = ((dispatcher.task("getNextStep"): any): (
  sourceId: SourceId,
  pausedPosition: AstPosition
) => Promise<?Location>);

export const clearASTs = ((dispatcher.task("clearASTs"): any): () => Promise<
  void
>);

export const getScopes = ((dispatcher.task("getScopes"): any): (
  location: Location
) => Promise<SourceScope[]>);

export const clearScopes = ((dispatcher.task(
  "clearScopes"
): any): () => Promise<void>);

export const clearSymbols = ((dispatcher.task(
  "clearSymbols"
): any): () => Promise<void>);

export const getSymbols = ((dispatcher.task("getSymbols"): any): (
  sourceId: string
) => Promise<SymbolDeclarations>);

export const hasSource = ((dispatcher.task("hasSource"): any): (
  sourceId: SourceId
) => Promise<Source>);

export const setSource = ((dispatcher.task("setSource"): any): (
  source: Source
) => Promise<void>);

export const clearSources = ((dispatcher.task(
  "clearSources"
): any): () => Promise<void>);

export const hasSyntaxError = ((dispatcher.task("hasSyntaxError"): any): (
  input: string
) => Promise<string | false>);

export const mapOriginalExpression = ((dispatcher.task(
  "mapOriginalExpression"
): any): (
  expression: string,
  mappings: {
    [string]: string | null
  }
) => Promise<string>);

export const getFramework = ((dispatcher.task("getFramework"): any): (
  sourceId: string
) => Promise<?string>);

export const getPausePoints = ((dispatcher.task("getPausePoints"): any): (
  sourceId: string
) => Promise<PausePoints>);

export type {
  SourceScope,
  BindingData,
  BindingLocation,
  BindingLocationType,
  BindingDeclarationLocation,
  BindingMetaValue,
  BindingType
} from "./getScopes";

export type {
  AstLocation,
  AstPosition,
  PausePoint,
  PausePoints
} from "./types";

export type {
  ClassDeclaration,
  SymbolDeclaration,
  SymbolDeclarations,
  FunctionDeclaration
} from "./getSymbols";
