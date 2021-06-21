# TinyMCE for Contentful - App



# Packaging

This is packaged as Contentful UI Extension. The `extension.json` file defines
the extension and points it to an external web server to serve the extension's files.

In Tiny's case, the files in `src/` are deployed to:
 - https://contentful.tiny.cloud/ (production)
 - https://contentful-staging.tiny.cloud/ (staging)


# Testing this integration

## Creating your own App

Launch your instance:

  - Install dependencies `yarn install`

  - Start the server `yarn serve`

Head over to Contentful.com and create a new account if you don't have one.

Head over to `Organization settings & subscriptions` -> `Apps` -> `Create App`

Select any name and point the App URL to where you are hosting this distribution (`http://localhost:8080`)

In `Locations`, select `Entry field` and check `Rich text`

Save

## Install the App to your environment

Select your environment ('Contentful Apps' if you just created your account)

Select `Apps` -> `Manage Apps`

Scroll down and install the App you just created

## Editing content

Go to `Content model` to create or update content models with Rich Text as a field

Add a new `Content Type`, then add a `Rich Text` field

Select `Create and configure` or `Create` and then go to `settings`

In the configuration modal, go to `Appearance` and select the App you just created

Go to `Content` and create or edit an entry using TinyMCE


