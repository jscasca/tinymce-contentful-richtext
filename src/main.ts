import { init, locations } from "@contentful/app-sdk";
import { Configurator } from './config/Configurator';
import { ContentfulEditor } from "./editor/ContentfulEditor";
import { ScriptLoader } from './util/ScriptLoader';

init((sdk) => {

  if (sdk.location.is(locations.LOCATION_APP_CONFIG)) {
    // app conf
    console.log('showing configuration');
    const div = document.getElementById('editor');
    if (div) div.innerHTML = "<p>Hello world</p>";
    Configurator();
  } else {
    ScriptLoader(document, 'https://cdn.tiny.cloud/1/asdfasdf/tinymce/5/tinymce.min.js', () => {
      ContentfulEditor(sdk);
    });
  }
});