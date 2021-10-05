import { AppExtensionSDK, FieldExtensionSDK, init, locations } from "@contentful/app-sdk";
import { Configurator } from './config/Configurator';
import { ContentfulEditor } from "./editor/ContentfulEditor";
import { ScriptLoader } from './util/ScriptLoader';

// TBD: Fix styles
import '@contentful/forma-36-react-components/dist/styles.css';
import '@contentful/forma-36-fcss/dist/styles.css';
import './index.css';

init((sdk) => {
  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    Configurator(sdk as AppExtensionSDK);
  } else {
    const apiKey = (sdk.parameters?.instance as any).apiKey || 'no-api-key'
    ScriptLoader(document, 'https://cdn.tiny.cloud/1/' + apiKey + '/tinymce/5/tinymce.min.js', () => {
      ContentfulEditor(sdk as FieldExtensionSDK);
    });
  }
});