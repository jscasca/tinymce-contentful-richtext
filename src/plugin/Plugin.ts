import * as NodeFilters from './core/NodeFilters';
import * as Controls from './ui/Controls';

export default (ctfApi: any) => (editor: any, url: string) => {
  console.log('setting up plugin');
  // skipping commands
  // only 3 types of links: absolute url, asset or entry
  // setup buttons
  // setup menu items
  // setup context menu
  // add shortcuts
  NodeFilters.setup(editor, ctfApi);
  Controls.setupButtons(editor, ctfApi);
};