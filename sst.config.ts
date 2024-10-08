/* eslint-disable */
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "genesiss-agents",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {

    const bucket = new sst.aws.Bucket("GenesissAgentsBucket");

    const publicbucket = new sst.aws.Bucket("GenesissAgentsPublicBucket", {
      public: true
    });

    const genesisssearchapikey = new sst.Secret("GenesissAgentsAPIKey")

    const SessionsTable = new sst.aws.Dynamo("GenesissAgentsSessionsTable", {
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
      ],
      domain: "agents.genesiss.tech",
    });
  },
});
