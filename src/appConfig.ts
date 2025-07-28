import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from "@aws-sdk/client-appconfigdata";

const client = new AppConfigDataClient({
  region: process.env.AWS_REGION || "us-east-1",
});

let configToken: string | undefined;

const state = {
  cachedMessage: process.env.DEFAULT_MESSAGE || "fallback-value",
};

async function startSession() {
  try {
    const session = await client.send(
      new StartConfigurationSessionCommand({
        ApplicationIdentifier: process.env.AWS_APPCONFIG_APPLICATION!,
        EnvironmentIdentifier: process.env.AWS_APPCONFIG_ENVIRONMENT!,
        ConfigurationProfileIdentifier: process.env.AWS_APPCONFIG_PROFILE!,
      })
    );
    configToken = session.InitialConfigurationToken;
  } catch (err) {
    console.warn("⚠️ Could not start AppConfig session, using fallback:", err);
    configToken = undefined;
  }
}

export async function refreshAppConfig(): Promise<string> {
  if (!configToken) {
    await startSession();
  }
  if (!configToken) {
    // Fallback to .env value
    return state.cachedMessage;
  }

  try {
    const configResponse = await client.send(
      new GetLatestConfigurationCommand({ ConfigurationToken: configToken })
    );

    if (configResponse.NextPollConfigurationToken) {
      configToken = configResponse.NextPollConfigurationToken;
    }

    if (configResponse.Configuration && configResponse.Configuration.length > 0) {
      const raw = new TextDecoder().decode(configResponse.Configuration);
      const jsonData = JSON.parse(raw);

      if (jsonData.message) {
        state.cachedMessage = jsonData.message;
        console.log("🔄 AppConfig message updated:", state.cachedMessage);
      } else {
        // No "message" key, fallback
        state.cachedMessage = process.env.DEFAULT_MESSAGE || "fallback-value";
        console.warn("⚠️ AppConfig JSON missing 'message', using fallback");
      }
    }
  } catch (err) {
    console.warn("⚠️ Error fetching AppConfig value, using fallback:", err);
    state.cachedMessage = process.env.DEFAULT_MESSAGE || "fallback-value";
  }

  return state.cachedMessage;
}

export function getAppConfigValue(): string {
  return state.cachedMessage;
}

export async function initAppConfig(): Promise<void> {
  await refreshAppConfig(); // First fetch
  setInterval(refreshAppConfig, 2 * 60 * 1000); // Refresh every 2 mins
}
