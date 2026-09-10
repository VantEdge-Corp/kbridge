import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { ALLOWED_IMAGE_TYPES, type UploadBody } from '@peaches/core';

/**
 * Opens the photo library and returns an upload body for @peaches/core, or
 * null when the member cancels. Runs inside Expo Go (no camera module).
 */
export async function pickImage(options: { aspect?: [number, number] } = {}): Promise<UploadBody | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library access was denied. You can allow it in Settings.');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!options.aspect,
    aspect: options.aspect,
    quality: 0.8,
    base64: true,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset?.base64) throw new Error('That photo could not be read.');
  const body = decode(asset.base64);
  const contentType =
    asset.mimeType && (ALLOWED_IMAGE_TYPES as readonly string[]).includes(asset.mimeType) ? asset.mimeType : 'image/jpeg';
  return { body, contentType, size: asset.fileSize ?? body.byteLength };
}
