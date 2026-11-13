// app/brand.ts
//
// Every name and the logo shown on the driver sign-in, the driver app, the
// fleet portal and the transport page come from here. To change the wording,
// edit this file. To remove the logo everywhere, set `logo` to null.

export const BRAND = {
  owner: 'TETFund',
  host: 'UniWeb',

  // Driver sign-in and driver app
  driverTitle: 'TETFund Campus Tricycles',
  driverSubtitle: 'Driver portal · Hosted by UniWeb',

  // Fleet portal
  fleetTitle: 'TETFund Campus Tricycle Fleet',
  fleetSubtitle: 'Fleet portal · Hosted by UniWeb',

  // File in the frontend's public/ folder. null = no logo (a 🛺 is shown instead)
  logo: '/tetfund-logo.png' as string | null,
}