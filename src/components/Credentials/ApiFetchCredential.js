// apiUtils.js

import * as api from '../../api';
import parseJwt from '../../functions/ParseJwt';

export async function fetchCredentialData(id = null) {
  try {
    const response = await api.get('/storage/vc');

    if (id) {
      const targetImage = response.data.vc_list.find((img) => img.id.toString() === id);
      const newImages = targetImage
        ? [targetImage].map((item) => ({
            id: item.id,
						credentialIdentifier:item.credentialIdentifier,
            src: item.logoURL,
            alt: item.issuerFriendlyName,
            data: parseJwt(item.credential)["vc"]['credentialSubject'],
            type: parseJwt(item.credential)['vc']["type"]["2"],
            expdate: parseJwt(item.credential)['vc']["expirationDate"],
          }))
        : [];

      return newImages[0];
    } else {
      const newImages = response.data.vc_list.map((item) => ({
        id: item.id,
				credentialIdentifier:item.credentialIdentifier,
        src: item.logoURL,
        alt: item.issuerFriendlyName,
        data: parseJwt(item.credential)["vc"]['credentialSubject'],
        type: parseJwt(item.credential)['vc']["type"]["2"],
        expdate: parseJwt(item.credential)['vc']["expirationDate"],
      }));

      return newImages;
    }
  } catch (error) {
    console.error('Failed to fetch data', error);
    return null;
  }
}

export async function fetchAllCredentialData(id) {
  try {
    const response = await api.get('/storage/vc');

    if (id) {

      const targetImage = response.data.vc_list.find((img) => img.id.toString() === id);
      const newImages = parseJwt(targetImage.credential)["vc"];
      return newImages;

		} else {
      const newImages = response.data.vc_list.map((item) => ({
				credentialData : parseJwt(item.credential)["vc"]
      }));

      return newImages;
    }
  } catch (error) {
    console.error('Failed to fetch data', error);
    return null;
  }
}
