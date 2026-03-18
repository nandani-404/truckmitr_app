import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';

/**
 * Converts a remote image URL to a base64 string for sharing.
 * This ensures that a thumbnail is visible in apps like WhatsApp, Instagram, etc.
 */
export const getBase64Image = async (url: string): Promise<{ data: string, mimeType: string } | null> => {
    if (!url) return null;
    
    try {
        const res = await ReactNativeBlobUtil.config({
            fileCache: true,
        }).fetch('GET', url);
        
        const status = res.info().status;
        console.log(`🌐 Base64 conversion for ${url} - Status: ${status}`);
        
        if (status !== 200) {
            await res.flush();
            return null;
        }

        const base64 = await res.readFile('base64');
        if (!base64 || base64.length < 10) {
            await res.flush();
            return null;
        }

        const extension = url.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
        
        // Clean up the cache
        await res.flush();
        
        const data = `data:${mimeType};base64,${base64}`;
        console.log(`🌐 Base64 conversion successful, length: ${data.length}`);
        return { data, mimeType };
    } catch (error) {
        console.log('Error converting image to base64:', error);
        return null;
    }
};
