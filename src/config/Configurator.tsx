import React, { useCallback, useState, useEffect, ChangeEvent } from 'react';
import { AppExtensionSDK } from '@contentful/app-sdk';
import { render } from 'react-dom';
import { Heading, Paragraph, TextField, Workbench } from '@contentful/forma-36-react-components';
import { css } from 'emotion';

export interface AppInstallationParameters {}

interface ConfigProps {
  sdk: AppExtensionSDK;
}

const Config = (props: ConfigProps) => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});

  const onConfigure = useCallback(async () => {
    const currentState = await props.sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, props.sdk]);

  useEffect(() => {
    props.sdk.app.onConfigure(() => onConfigure());
  }, [props.sdk, onConfigure]);

  useEffect(() => {
    let mounted = true;
    props.sdk.app.getParameters().then((p) => {
      if (mounted) {
        setParameters(p);
      }
    });
    props.sdk.app.setReady();
    return () => {
      mounted = false;
    };
  }, [props.sdk]);

  const onTextFieldChange = (e: ChangeEvent): void => {
    const { name, value } = e.target as HTMLInputElement;
    setParameters({...parameters, ...{[name]: value}});
  };

  return (
    <Workbench className={css({ margin: '80px' })}>
        <Heading>TinyMCE Editor Configuration</Heading>
        <Paragraph>Select the configuration for your TinyMCE editor to use as a field editor in Rich Text and Long Text fields.</Paragraph>
        <div>
          <TextField
            name="apiKey"
            id="apiKey"
            labelText="TinyMCE API Key"
            helpText="Your TinyMCE API key"
            onChange={onTextFieldChange}
            value={parameters.apiKey || ''}
          />
          <TextField
            name="plugins"
            id="plugins"
            labelText="Plugins"
            helpText="Extend the Editor instance by selecting which plugins to use."
            onChange={onTextFieldChange}
            value={parameters.plugins || ''}
          />
          <TextField
            name="toolbar"
            id="toolbar"
            labelText="Toolbar"
            helpText="This option allows you to specify the buttons and the order that they will appear on TinyMCE’s toolbar."
            onChange={onTextFieldChange}
            value={parameters.toolbar || ''}
          />
        </div>
    </Workbench>
  );
}

export const Configurator = (sdk: AppExtensionSDK): void => {
  const root = document.getElementById('editor');
  render(<Config sdk={sdk}/>, root);
};