/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    EventFired,
    EventHandler,
    failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Goal } from "../../../../common/delivery/goals/Goal";
import {
    CodeReactionInvocation,
    CodeReactionListener,
} from "../../../../common/listener/CodeReactionListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import {
    OnAnyPendingStatus,
    StatusState,
} from "../../../../typings/types";
import { filesChangedSince } from "../../../../util/git/filesChangedSince";
import { createStatus } from "../../../../util/github/ghub";
import { ExecuteGoalInvocation, Executor, StatusForExecuteGoal } from "../ExecuteGoalOnSuccessStatus";

export function executeCodeReactions(codeReactions: CodeReactionListener[]): Executor {
    return async (status: StatusForExecuteGoal.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        logger.info("Will run %d code reactions on %j", codeReactions.length, id);

        if (status.context !== params.goal.context || status.state !== "pending") {
            logger.warn(`I was looking for ${params.goal.context} being pending, but I heard about ${status.context} being ${status.state}`);
            return Success;
        }

        const addressChannels = addressChannelsFor(commit.repo, ctx);
        if (codeReactions.length > 0) {
                const project = await GitCommandGitProject.cloned(credentials, id);
                const push = commit.pushes[0];
                const filesChanged = push.before ? await filesChangedSince(project, push.before.sha) : [];

                const i: CodeReactionInvocation = {
                    id,
                    context: ctx,
                    addressChannels,
                    project,
                    credentials,
                    filesChanged,
                };
                const allReactions: Promise<any> =
                    Promise.all(codeReactions.map(reaction => reaction(i)));
                await allReactions;
            }
    };
}
