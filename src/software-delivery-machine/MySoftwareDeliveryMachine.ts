import { HandleCommand, HandleEvent } from "@atomist/automation-client";
import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { AbstractSoftwareDeliveryMachine } from "../blueprint/AbstractSoftwareDeliveryMachine";
import { PromotedEnvironment } from "../blueprint/DeliveryBlueprint";
import { BuildOnScanSuccessStatus } from "../handlers/events/delivery/build/BuildOnScanSuccessStatus";
import { OnDeployStatus } from "../handlers/events/delivery/deploy/OnDeployStatus";
import { SetupPhasesOnPush } from "../handlers/events/delivery/phase/SetupPhasesOnPush";
import { Phases } from "../handlers/events/delivery/Phases";
import { HttpServicePhases } from "../handlers/events/delivery/phases/httpServicePhases";
import { LibraryPhases } from "../handlers/events/delivery/phases/libraryPhases";
import { CodeInspection } from "../handlers/events/delivery/review/ReviewOnPendingScanStatus";
import { OnVerifiedStatus } from "../handlers/events/delivery/verify/OnVerifiedStatus";
import { VerifyOnEndpointStatus } from "../handlers/events/delivery/verify/VerifyOnEndpointStatus";
import { ActOnRepoCreation } from "../handlers/events/repo/ActOnRepoCreation";
import { FingerprintOnPush } from "../handlers/events/repo/FingerprintOnPush";
import { OnFirstPushToRepo } from "../handlers/events/repo/OnFirstPushToRepo";
import { ReactToSemanticDiffsOnPushImpact } from "../handlers/events/repo/ReactToSemanticDiffsOnPushImpact";
import { OnImageLinked } from "../typings/types";
import { LocalMavenBuildOnSucessStatus } from "./blueprint/build/LocalMavenBuildOnScanSuccessStatus";
import {
    CloudFoundryProductionDeployOnFingerprint,
    CloudFoundryStagingDeployOnImageLinked,
} from "./blueprint/deploy/cloudFoundryDeploy";
import { DeployToProd } from "./blueprint/deploy/deployToProd";
import { DescribeStagingAndProd } from "./blueprint/deploy/describeRunningServices";
import { NotifyOnDeploy } from "./blueprint/deploy/notifyOnDeploy";
import { OfferPromotion, offerPromotionCommand } from "./blueprint/deploy/offerPromotion";
import { MyFingerprinter } from "./blueprint/fingerprint/calculateFingerprints";
import { SemanticDiffReactor } from "./blueprint/fingerprint/reactToFingerprintDiffs";
import { PhaseSetup } from "./blueprint/phase/phaseManagement";
import { OnNewRepoWithCode } from "./blueprint/repo/onFirstPush";
import { logInspect, logReview } from "./blueprint/review/inspect";
import { VerifyEndpoint } from "./blueprint/verify/verifyEndpoint";
import { addCloudFoundryManifest } from "./commands/editors/addCloudFoundryManifest";
import { springBootGenerator } from "./commands/generators/spring/springBootGenerator";

export class MySoftwareDeliveryMachine extends AbstractSoftwareDeliveryMachine {

    public onRepoCreation: Maker<ActOnRepoCreation> = ActOnRepoCreation;

    public onNewRepoWithCode: Maker<OnFirstPushToRepo> = OnNewRepoWithCode;

    public fingerprinter: Maker<FingerprintOnPush> = MyFingerprinter;

    public semanticDiffReactor: Maker<ReactToSemanticDiffsOnPushImpact> = SemanticDiffReactor;

    public phaseSetup: Maker<SetupPhasesOnPush> = PhaseSetup;

    public builder: Maker<BuildOnScanSuccessStatus> = LocalMavenBuildOnSucessStatus;

    public deploy1: Maker<HandleEvent<OnImageLinked.Subscription>> =
        CloudFoundryStagingDeployOnImageLinked;

    public verifyEndpoint: Maker<VerifyOnEndpointStatus> = VerifyEndpoint;

    public notifyOnDeploy: Maker<OnDeployStatus> = NotifyOnDeploy;

    public onVerifiedStatus: Maker<OnVerifiedStatus> = OfferPromotion;

    public promotedEnvironment: PromotedEnvironment = {

        name: "production",

        offerPromotionCommand,

        promote: DeployToProd,

        deploy: CloudFoundryProductionDeployOnFingerprint,
    };

    public generators: Array<Maker<HandleCommand>> = [
        () => springBootGenerator(),
    ];

    public editors: Array<Maker<HandleCommand>> = [];

    public supportingCommands: Array<Maker<HandleCommand>> = [
        () => addCloudFoundryManifest,
        DescribeStagingAndProd,
    ];

    protected get possiblePhases(): Phases[] {
        return [HttpServicePhases, LibraryPhases];
    }

    protected get projectReviewers(): ProjectReviewer[] {
        return [logReview];
    }

    protected get codeInspections(): CodeInspection[] {
        return [logInspect];
    }

}
