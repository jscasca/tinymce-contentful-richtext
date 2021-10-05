import { Status, IsAsset } from './Entities';

interface Color {
  color: string;
  background: string;
  border: string;
}

const embedColors: Record<Status, Color> = {
  PUBLISHED: {
    color: '#1a6848',
    background: '#d9f2e4',
    border: '#1a593e'
  },
  DRAFT: {
    color: '#a85701',
    background: '#ffefd5',
    border: '#a85701'
  },
  CHANGED: {
    color: '#2d64b3',
    background: '#edf4fc',
    border: '#174e8c',
  },
  ARCHIVED: {
    color: '#a82d3e',
    background: '#fce9e8',
    border: '#7c262f',
  },
  PENDING: {
    color: '#283848',
    background: '#e5ebed',
    border: '#cccccc',
  }
}

const getImageContainer = (src: string, title: string): string => {
  const imageTemplate = '\
  <div style="height:100%;display:flex;align-items:center;justify-content:center;">\
    <img style="width: auto;max-width:100%;max-height:100%;" src="' + src + '" alt="' + title + '">\
  </div>';
  return imageTemplate;
};

const getDefaultContainer = (asset: any): string => {
  const title = asset.fields.title['en-US'];
  // put a file icon here or something
  const fileTemplate = '\
  <div style="display:flex;justify-content:center;width:100%;margin-bottom:1.25rem;margin-top:1.25rem;">\
    <span>&nbsp;</span>\
  </div>\
  <span style="color:#ccc;max-width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-size:0.9rem;">' + title + '</span>';
  return fileTemplate;
};

const getAssetImageContainer = (asset: any): string => {
  const title = asset.fields.title['en-US'];
  const src = asset.fields.file['en-US'].url;
  return getImageContainer(src, title);
};

const getAssetContentHtml = (asset: any): string => {
  console.log(asset);
  const file = asset.fields.file['en-US'];
  const contentType = file.contentType;
  if (contentType === 'image/png' || contentType === 'image/jpeg') {
    return getAssetImageContainer(asset);
  }
  return getDefaultContainer(asset);
};

const getPendingAssetContent = (fakeAsset: any): string => {
  return getImageContainer(fakeAsset.src, fakeAsset.title);
};

export const GetAssetHtml = (status: Status, asset: any): string => {
  console.log(asset);
  const assetContent = IsAsset(asset) ? getAssetContentHtml(asset) : getPendingAssetContent(asset);
  const entryTemplate = '\
  <div style="border-radius:6px;border:1px solid #ccc;margin-bottom:1.25rem;">\
    <div style="border-bottom:1px solid #ccc;display:flex;justify-content:flex-end;align-items:center;padding:8px 15px;">\
      <div style="line-height:20px;font-size:0.75rem;font-weight:600;letter-spacing:0.06rem;border-radius:4px;padding:0 4px;color:' + embedColors[status].color + ';background-color:'+ embedColors[status].background +'">' + Status[status] + '</div>\
    </div>\
    <div style="display:flex;padding:2px 5px;">\
      <div style="white-space:nowrap;overflow:hidden;width:100%;">\
        <div style="height:16.5rem;overflow:hidden;position:relative;">\
        ' + assetContent + '\
        </div>\
      </div>\
    </div>\
  <div>';
  return entryTemplate;
};

export const GetEntryHtml = (status: Status, content: string, contentType: string): string => {
  const entryTemplate = '\
  <div style="border-radius:6px;border:1px solid #ccc;margin-bottom:1.25rem;">\
    <div style="border-bottom:1px solid #ccc;display:flex;justify-content:flex-end;align-items:center;padding:8px 15px;">\
      <div style="flex:1 1 0;font-size:0.9rem;color:#606c7c;word-break:break-word;padding-right:5px;" class="content_type">' + contentType + '</div>\
      <div style="line-height:20px;font-size:0.75rem;font-weight:600;letter-spacing:0.06rem;border-radius:4px;padding:0 4px;color:' + embedColors[status].color + ';background-color:'+ embedColors[status].background +'">' + Status[status] + '</div>\
    </div>\
    <div style="display:flex;padding:2px 15px;">\
      <div style="white-space:nowrap;overflow:hidden;width:100%;">\
        <p style="word-break:break-word;text-overflow:ellipsis;overflow:hidden;">' + content + '</p>\
      </div>\
    </div>\
  <div>';
  return entryTemplate;
};

export const GetInlineEntryHtml = (status: Status, content: string): string => {
  const entryTemplate = '\
  <span style="max-width:100%;display:inline-flex;align-items:center;position:relative;border-radius:6px;border: 1px solid #ccc">\
    <span style="position:absolute;height:100%;width:6px;left:-1px;background-color:' + embedColors[status].color + ';border:1px solid ' + embedColors[status].border + '"></span>\
    <span style="padding: 2px 10px;">' + content + '</span>\
  </span>';
  return entryTemplate;
};

export const GetMention = (): string => {
  return '';
}