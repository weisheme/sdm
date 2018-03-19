import { HandleCommand, HandlerContext, logger, Parameter, Parameters } from "@atomist/automation-client";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import { AllJavaFiles } from "@atomist/spring-automation/commands/generator/java/javaProjectUtils";
import { editorCommand } from "../../../../handlers/commands/editors/editorCommand";
import { RequestedCommitParameters } from "../support/RequestedCommitParameters";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

@Parameters()
export class ApplyHeaderParameters extends RequestedCommitParameters {

    @Parameter({required: false})
    public glob: string = AllJavaFiles;

    @Parameter({required: false})
    public license: "apache" = "apache";

    @Parameter({required: false})
    public readonly successEmoji = ":carousel_horse:";

    constructor() {
        super("Add missing license headers");
    }

    get header(): string {
        switch (this.license) {
            case "apache" :
                return ApacheHeader;
            default :
                throw new Error(`'${this.license}' is not a supported license`);
        }
    }
}

/* tslint:disable */
export const ApacheHeader = `/*
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
 */`;

export const applyApacheLicenseHeaderEditor: HandleCommand = editorCommand(
    () => applyHeaderProjectEditor,
    "addHeader",
    ApplyHeaderParameters,
    {
        editMode: ahp => ahp.editMode
    });

export async function applyHeaderProjectEditor(p: Project,
                                               ctx: HandlerContext,
                                               params: ApplyHeaderParameters): Promise<Project> {
    let headersAdded = 0;
    let matchingFiles = 0;
    await doWithFiles(p, params.glob, async f => {
        ++matchingFiles;
        const content = await f.getContent();
        if (content.includes(params.header)) {
            return;
        }
        if (hasDifferentHeader(params.header, content)) {
            return ctx.messageClient.respond(`\`${f.path}\` already has a different header`);
        }
        logger.info("Adding header of length %d to %s", params.header.length, f.path);
        ++headersAdded;
        return f.setContent(params.header + "\n\n" + content);
    });
    const sha: string = !!(p as GitProject).gitStatus ? (await (p as GitProject).gitStatus()).sha : p.id.sha;
    logger.info("%d files matched [%s]. %s headers added. %d files skipped", matchingFiles, params.glob, headersAdded, matchingFiles - headersAdded);
    if (headersAdded > 0) {
        await ctx.messageClient.respond(`*License header editor* on \`${sha}\`: ${matchingFiles} files matched \`${params.glob}\`. ` +
            `${headersAdded} headers added. ${matchingFiles - headersAdded} files skipped ${params.successEmoji}`);
    }
    return p;
}

function hasDifferentHeader(header: string, content: string): boolean {
    if (content.startsWith("/*")) {
        if (content.startsWith(header)) {
            // great
            return false;
        }
        logger.debug("I was looking for: " + header);
        logger.debug("This file here starts with: " + content.slice(0, 300));
        return true;
    }
}
