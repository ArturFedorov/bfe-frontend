import { ParsedVersion } from './semver_parser';

/**
 * Parse a semver string such as `1.2.3` or `1.2.3-beta.1` into its parts.
 *
 * @throws if the input is not a valid `major.minor.patch[-prerelease]` string.
 */
export function parseVersion(input: string): ParsedVersion {
  const [withoutBuild] = input.split('+');

  const hyphenIndex = withoutBuild.indexOf('-');
  let core;
  let prerelease: string | null = null;

  if (hyphenIndex !== -1) {
    core = withoutBuild.slice(0, hyphenIndex);
    prerelease = withoutBuild.slice(hyphenIndex + 1);
    if (prerelease.length === 0) {
      throw new Error('Empty prerelease');
    }
  } else {
    core = withoutBuild;
  }

  const parts = core.split('.');
  if (parts.length !== 3) {
    throw new Error('Must have exactly 3 version parts.');
  }

  const [major, minor, patch] = parts.map((part) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(`Invalid version part: ${part}`);
    }

    if (part.length > 1 && part[0] === '0') {
      throw new Error('Leading zero');
    }

    return Number(part);
  });

  return {
    major,
    minor,
    patch,
    prerelease,
  };
}
