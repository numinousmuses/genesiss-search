/* eslint-disable */
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "genesiss-search",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {

    const bucket = new sst.aws.Bucket("GenesissSearchBucket");

    const publicbucket = new sst.aws.Bucket("GenesissSearchPublicBucket", {
      public: true
    });

    const genesisssearchapikey = new sst.Secret("GenesissSearchAPIKey")

    const SessionsTable = new sst.aws.Dynamo("GenesissSearchSessionsTable", {
      fields: {
        sessionId: "string",
        userId: "string",
      },
      primaryIndex: { hashKey: "sessionId", rangeKey: "userId" },

    })

    const finaluserstable = new sst.aws.Dynamo("FinalUsersTable", {
      fields: {
        userID: "string",
      },
      primaryIndex: { hashKey: "userID" }
    });

    const chatstable = new sst.aws.Dynamo("ChatsTable", {
      fields: {
        chatID: "string",
        userID: "string",
      },
      primaryIndex: { hashKey: "chatID" },
      globalIndexes: {
        CreatedAtIndex: { hashKey: "userID" }
      }
    });

    const teamstable = new sst.aws.Dynamo("TeamsTable", {
      fields: {
        teamID: "string",
      },
      primaryIndex: { hashKey: "teamID" }
    });


    new sst.aws.Nextjs("GenesissSearch", {
      link: [
        bucket,
        publicbucket,
        genesisssearchapikey,
        SessionsTable,
        finaluserstable,
        chatstable,
        teamstable
      ]
    });
  },
});
