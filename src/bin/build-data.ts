#!/usr/bin/env node

import { buildCatalog } from "../model/buildCatalog";
import { buildServices } from "../model/buildServices";
import { join as pathJoin } from "path";
import type { CompiledData } from "../model/types";
import { removeReferent } from "../model/types";
import * as fs from "fs";
import { assert } from "tsafe/assert";
import { compiledDataJsonRelativeFilePath, buildBranch, createGitDbApi } from "../server/core/adapters/createGitDbApi";
import { ErrorNoBranch } from "../tools/gitSsh";
import { gitSsh } from "../tools/gitSsh";

async function main(params: {
    dataRepoSshUrl: string;
    sshPrivateKeyName: string;
    sshPrivateKey: string;
    isIncremental: boolean;
}): Promise<void> {
    const { dataRepoSshUrl, sshPrivateKeyName, sshPrivateKey, isIncremental } = params;

    const { fetchCompiledData, fetchDb } = createGitDbApi({
        dataRepoSshUrl,
        sshPrivateKey,
        sshPrivateKeyName
    });

    const { compiledData } = await (async () => {
        const { softwareRows, referentRows, softwareReferentRows, serviceRows } = await fetchDb();

        const currentCatalog = isIncremental
            ? await fetchCompiledData().then(
                  ({ catalog }) => catalog,
                  error =>
                      error instanceof ErrorNoBranch ? (console.log("There is no build branch yet"), undefined) : error
              )
            : undefined;

        const { catalog } = await buildCatalog({
            softwareRows,
            referentRows,
            softwareReferentRows,
            currentCatalog,
            "log": console.log
        });

        const { services } = await buildServices({
            serviceRows
        });

        const compiledData: CompiledData<"with referents"> = {
            catalog,
            services
        };

        return { compiledData };
    })();

    const compiledData_withoutReferents: CompiledData<"without referents"> = {
        ...compiledData,
        "catalog": compiledData.catalog.map(removeReferent)
    };

    gitSsh({
        "sshUrl": dataRepoSshUrl,
        sshPrivateKeyName,
        sshPrivateKey,
        "shaish": buildBranch,
        "action": ({ repoPath }) => {
            for (const [relativeJsonFilePath, data] of [
                [compiledDataJsonRelativeFilePath, compiledData],
                [
                    `${compiledDataJsonRelativeFilePath.replace(/\.json$/, "")}_withoutReferents.json`,
                    compiledData_withoutReferents
                ]
            ] as const) {
                fs.writeFileSync(
                    pathJoin(repoPath, relativeJsonFilePath),
                    Buffer.from(JSON.stringify(data, null, 2), "utf8")
                );
            }

            return Promise.resolve({
                "doCommit": true,
                "doAddAll": true,
                "message": "Updating compiled data"
            });
        }
    });
}

if (require.main === module) {
    const dataRepoSshUrl = process.env["DATA_REPO_SSH_URL"];

    assert(dataRepoSshUrl !== undefined);

    const sshPrivateKeyName = process.env["SSH_PRIVATE_KEY_NAME"];

    assert(sshPrivateKeyName !== undefined);

    const sshPrivateKey = process.env["SSH_PRIVATE_KEY"];

    assert(sshPrivateKey !== undefined);

    const INCREMENTAL = process.env["INCREMENTAL"];

    assert(INCREMENTAL === "true" || INCREMENTAL === "false");

    main({
        dataRepoSshUrl,
        sshPrivateKeyName,
        sshPrivateKey,
        "isIncremental": INCREMENTAL === "true"
    });
}
