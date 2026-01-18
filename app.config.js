export default ({ config }) => {
  const baseConfig = config ?? {};
  const androidConfig = baseConfig.android ?? {};
  const androidAppConfig = androidConfig.config ?? {};
  const googleMapsConfig = androidAppConfig.googleMaps ?? {};

  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON || androidConfig.googleServicesFile;
  const googleMapsApiKey =
    process.env.GOOGLE_MAPS_API_KEY || googleMapsConfig.apiKey;

  return {
    ...baseConfig,
    android: {
      ...androidConfig,
      googleServicesFile,
      config: {
        ...androidAppConfig,
        googleMaps: {
          ...googleMapsConfig,
          apiKey: googleMapsApiKey,
        },
      },
    },
    extra: {
      ...baseConfig.extra,
      eas: {
        projectId:
          process.env.EAS_PROJECT_ID ||
          baseConfig.extra?.eas?.projectId ||
          "your-project-id",
      },
    },
  };
};
