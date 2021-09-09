// const isEntry = (entity: any) => {
//   return entity?.sys?.type === 'Entry';
// };

// const isAsset = (entity: any) => {
//   return entity?.sys?.type === 'Asset';
// };

const getNext = (obj: any) => {
  return Object.entries(obj)[0][1];
};

export const IsEntryType = (entity: any, contentType: string): boolean => {
  return entity?.sys?.contentType?.sys?.id === contentType;
}

export const GetEntryField = (entity: any, field: string, defaultLocale: string = 'en-US', defaultValue: string = ''): string => {
  return entity.fields[field] ? entity.fields[field][defaultLocale] ? entity.fields[field][defaultLocale] : getNext(entity.fields[field]) : defaultValue;
};

export const GetContentTitle = (entity: any, defaultLocale: string = 'en-US'): string => {
  if (entity?.fields?.title) {
    return entity.fields.title[defaultLocale] ? entity.fields.title[defaultLocale] : getNext(entity.fields.title);
  }
  if (entity?.fields?.name) {
    return entity.fields.name[defaultLocale] ? entity.fields.name[defaultLocale] : getNext(entity.fields.title);
  }
  return 'Untitled';
};


// From: https://www.contentful.com/developers/docs/tutorials/general/determine-entry-asset-state/

export enum Status {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  CHANGED = 'CHANGED',
  ARCHIVED = 'ARCHIVED',
  PENDING = 'PENDING'
}

const isDraft = (entity: any): boolean => {
  return !entity.sys.publishedVersion;
}

const isChanged = (entity: any): boolean => {
  return !!entity.sys.publishedVersion && entity.sys.version >= entity.sys.publishedVersion + 2;
}

const isPublished = (entity: any): boolean => {
  return !!entity.sys.publishedVersion && entity.sys.version == entity.sys.publishedVersion + 1;
}

const isArchived = (entity: any): boolean => {
  return !!entity.sys.archivedVersion;
}

export const GetEntityStatus = (entity: any): Status => {
  if (isDraft(entity)) {
    return Status.DRAFT;
  }
  if (isChanged(entity)) {
    return Status.CHANGED;
  }
  if (isPublished(entity)) {
    return Status.PUBLISHED;
  }
  if (isArchived(entity)) {
    return Status.ARCHIVED;
  }
  return Status.PENDING;
};