// Facebook SDK integration
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const initFacebookSDK = () => {
  return new Promise<void>((resolve) => {
    // Check if Facebook SDK is already loaded
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      resolve();
    };

    // Load Facebook SDK
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  });
};

export const facebookLogin = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    window.FB.login((response: any) => {
      if (response.authResponse) {
        resolve(response.authResponse);
      } else {
        reject(new Error('Facebook login cancelled'));
      }
    }, { scope: 'email,public_profile,publish_to_groups' });
  });
};

export const postToFacebook = (postData: {
  message: string;
  link?: string;
  place?: string;
  name?: string;
  description?: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    // Use Facebook Share Dialog (recommended approach)
    window.FB.ui({
      method: 'share',
      href: postData.link || window.location.origin,
      quote: postData.message,
    }, (response: any) => {
      if (response && !response.error_message) {
        resolve();
      } else {
        reject(new Error(response?.error_message || 'Failed to post to Facebook'));
      }
    });
  });
};

export const checkInToPlace = (postData: {
  message: string;
  place: string;
  restaurantName: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    // Create a post with location mention using Facebook Share Dialog
    const shareMessage = `📍 Checked in at ${postData.restaurantName}!\n\n${postData.message}\n\n#FoodDeals`;
    
    window.FB.ui({
      method: 'share',
      href: window.location.origin,
      quote: shareMessage,
    }, (response: any) => {
      if (response && !response.error_message) {
        resolve();
      } else {
        reject(new Error(response?.error_message || 'Failed to check in'));
      }
    });
  });
};