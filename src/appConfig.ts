import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from "@aws-sdk/client-appconfigdata";

const client = new AppConfigDataClient({
  region: process.env.AWS_REGION || "us-east-1",
});

let configToken: string | undefined;

interface ConfigState {
  message: string;
  logo: string;
  backgroundColor: string;
}

const state: ConfigState = {
  message: process.env.DEFAULT_MESSAGE || "fallback-value",
  logo: process.env.DEFAULT_LOGO_URL || "/logo.svg",
  backgroundColor: process.env.DEFAULT_BACKGROUND_COLOR || "#282c34",
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

export async function refreshAppConfig(): Promise<ConfigState> {
  if (!configToken) {
    await startSession();
  }
  if (!configToken) {
    return state;
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

      // Update values if keys exist, otherwise fallback
      state.message = jsonData.message || process.env.DEFAULT_MESSAGE || state.message;
      state.logo = jsonData.logo || process.env.DEFAULT_LOGO_URL || state.logo;
      state.backgroundColor =
        jsonData.backgroundColor || process.env.DEFAULT_BACKGROUND_COLOR || state.backgroundColor;

      console.log("🔄 AppConfig updated:", state);
    }
  } catch (err) {
    console.warn("⚠️ Error fetching AppConfig, using fallback:", err);
  }

  return state;
}

export function getAppConfigValues(): ConfigState {
  return state;
}

export async function initAppConfig(): Promise<void> {
  await refreshAppConfig();
  setInterval(refreshAppConfig, 2 * 60 * 1000);
}
