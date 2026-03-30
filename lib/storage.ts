import { getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { assertFirebaseStorage } from '@/lib/firebase';

export type UploadResult = {
  url: string;
  path: string;
};

const isRemoteUrl = (value: string) => value.startsWith('http://') || value.startsWith('https://');

export const uploadImageAsync = async (uri: string, path: string): Promise<UploadResult> => {
  if (isRemoteUrl(uri)) {
    return { url: uri, path };
  }

  const storage = assertFirebaseStorage();
  const storageRef = ref(storage, path);
  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';

  await uploadBytes(storageRef, blob, { contentType });
  const url = await getDownloadURL(storageRef);

  return { url, path };
};

export const uploadSvgStringAsync = async (svg: string, path: string): Promise<UploadResult> => {
  const storage = assertFirebaseStorage();
  const storageRef = ref(storage, path);

  await uploadString(storageRef, svg, 'raw', {
    contentType: 'image/svg+xml',
  });

  const url = await getDownloadURL(storageRef);
  return { url, path };
};
