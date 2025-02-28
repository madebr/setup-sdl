import * as fs from "fs";
import * as path from "path";
import * as process from "process";

import * as cache from "@actions/cache";
import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

import { NINJA_VERSION } from "./constants";
import { SdlBuildPlatform, get_platform_root_directory } from "./platform";

export function get_ninja_download_url(
  platform: SdlBuildPlatform,
  version: string
): string {
  let zip_filename: string;
  switch (platform) {
    case SdlBuildPlatform.Linux:
      zip_filename = "ninja-linux.zip";
      break;
    case SdlBuildPlatform.Macos:
      zip_filename = "ninja-mac.zip";
      break;
    case SdlBuildPlatform.Windows:
      zip_filename = "ninja-win.zip";
      break;
  }
  return `https://github.com/ninja-build/ninja/releases/download/v${version}/${zip_filename}`;
}

export async function configure_ninja_build_tool(platform: SdlBuildPlatform) {
  const ninja_directory = `${get_platform_root_directory(platform)}/ninja`;
  fs.mkdirSync(ninja_directory, { recursive: true });

  const CACHE_KEY = `ninja-${platform}-${NINJA_VERSION}`;
  const CACHE_PATHS = [ninja_directory];
  // Pass a copy of CACHE_PATHS since cache.restoreCache modifies/modified its arguments
  const found_cache_key = await cache.restoreCache(
    CACHE_PATHS.slice(),
    CACHE_KEY,
    [`ninja-{platform}`]
  );

  if (!found_cache_key) {
    core.info(`Could not find ninja in the cache.`);

    const ninja_url = get_ninja_download_url(platform, NINJA_VERSION);
    core.info(`Downloading ${ninja_url}.`);
    const ninja_zip_path = await tc.downloadTool(ninja_url);
    core.info(`Extracting ${ninja_zip_path}.`);
    await tc.extractZip(ninja_zip_path, ninja_directory);

    await cache.saveCache(CACHE_PATHS.slice(), CACHE_KEY);
  }

  process.env.PATH = ninja_directory + path.delimiter + process.env.PATH;
}
