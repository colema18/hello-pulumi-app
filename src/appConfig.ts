import "dotenv/config"; // <-- Make sure you install dotenv: npm i dotenv

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

// 🔹 Helper to get value with fallback logic
function getEnvOrDefault(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

const defaultState: ConfigState = {
  message: getEnvOrDefault("DEFAULT_MESSAGE", "fallback-value"),
  logo: getEnvOrDefault("DEFAULT_LOGO_URL", "/logo.svg"),
  backgroundColor: getEnvOrDefault("DEFAULT_BACKGROUND_COLOR", "#282c34"),
};

let state: ConfigState = { ...defaultState };

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
    console.warn("Could not start AppConfig session, using fallback:", err);
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

      state = {
        message: jsonData.message || defaultState.message,
        logo: jsonData.logo || defaultState.logo,
        backgroundColor: jsonData.backgroundColor || defaultState.backgroundColor,
      };

      console.log("AppConfig updated:", state);
    }
  } catch (err) {
    console.warn("Error fetching AppConfig, using fallback:", err);
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
