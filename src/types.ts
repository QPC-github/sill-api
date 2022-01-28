// https://git.sr.ht/~etalab/sill
/*
 * All fields with _ will eventually be fetched from wikiData and thus, removed from Software.
 * We will create a bot that automatically puts data into WikiData. See: http://baskauf.blogspot.com/2019/06/putting-data-into-wikidata-using.html
 * An API will gather all the missing infos so that sill.etalab.gouv.fr and code.gouv.fr work with it.
 * All the fields with __ will be deduced from other metadata.
 */
export type Software = {
    //The id should be the one of Wikidata
    _id: number;
    _name: string;
    _function: string;
    //This info could be fetched from git blame.
    __referencedSinceTime: number;
    recommendationStatus: RecommendationStatus;
    parentSoftware?: SoftwareRef;
    isFromFrenchPublicService: boolean;
    isPresentInSupportContract: boolean;
    alikeSoftwares: SoftwareRef[];
    //Should not be optional
    wikidataId?: string;
    //Example https://comptoir-du-libre.org/en/softwares/461 -> 461
    /* cspell: disable-next-line */
    comptoirDuLibreOrgId?: number;
    // https://spdx.org/licenses/
    // https://www.data.gouv.fr/fr/pages/legal/licences/
    _license: string;
    whereAndInWhatContextIsItUsed?: string;
    //Lien vers catalogue.numerique.gouv.fr
    /* cspell: disable-next-line */
    catalogNumeriqueGouvFrId?: string;
    mimGroup: MimGroup;
    //The version min will actually be the current one at the time the software if first added.
    __versionMin: string;
    versionMax?: string;
    referentId: number | undefined;
    isReferentExpert?: true;
};

export type Referent = {
    id: number;
    email: string;
    emailAlt?: string;
};

export type SoftwareRef = SoftwareRef.Known | SoftwareRef.Unknown;
export namespace SoftwareRef {
    export type Known = {
        isKnown: true;
        softwareId: number;
    };

    export type Unknown = {
        isKnown: false;
        softwareName: string;
    };
}

export const recommendationStatuses = [
    "recommended",
    "in observation",
    "no longer recommended",
] as const;

export type RecommendationStatus = typeof recommendationStatuses[number];

export const mimGroups = ["MIMO", "MIMDEV", "MIMPROD", "MIMDEVOPS"] as const;

export type MimGroup = typeof mimGroups[number];
