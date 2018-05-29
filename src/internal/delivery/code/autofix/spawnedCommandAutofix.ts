/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { PushTest } from "../../../../api/mapping/PushTest";
import { AutofixRegistration, AutofixRegistrationOptions, editorAutofixRegistration } from "../../../../api/registration/AutofixRegistration";
import { SpawnCommand } from "../../../../util/misc/spawned";
import { localCommandsEditor } from "../../../command/support/localCommandsEditor";

/**
 * Register an autofix based on spawned local shell commands.
 * For example, could wrap a linter
 */
export function spawnedCommandAutofix(name: string,
                                      pushTest: PushTest,
                                      options: AutofixRegistrationOptions,
                                      command1: SpawnCommand,
                                      ...additionalCommands: SpawnCommand[]): AutofixRegistration {
    return editorAutofixRegistration({
        name,
        editor: localCommandsEditor([command1].concat(additionalCommands)),
        pushTest,
        options,
    });
}