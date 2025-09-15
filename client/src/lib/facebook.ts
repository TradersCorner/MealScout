// Facebook SDK integration
declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    __FB_INITED?: boolean;
  }
}

export const initFacebookSDK = () => {
  return new Promise<void>((resolve, reject) => {
    // Validate Facebook App ID is configured
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
    if (!appId) {
      console.warn('Facebook App ID not configured. Facebook sharing will not be available.');
      reject(new Error('Facebook App ID not configured'));
      return;
    }

    // Check if Facebook SDK is already loaded and initialized
    if (window.FB && window.__FB_INITED) {
      resolve();
      return;
    }

    // If FB exists but not initialized, initialize it
    if (window.FB && !window.__FB_INITED) {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        window.__FB_INITED = true;
        console.log('Facebook SDK initialized successfully');
        resolve();
        return;
      } catch (error) {
        console.error('Failed to initialize existing Facebook SDK:', error);
        reject(error);
        return;
      }
    }

    window.fbAsyncInit = function() {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });
        window.__FB_INITED = true;
        console.log('Facebook SDK initialized successfully');
        resolve();
      } catch (error) {
        console.error('Failed to initialize Facebook SDK:', error);
        reject(error);
      }
    };

    // Load Facebook SDK with error handling
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.onerror = function() {
        console.error('Failed to load Facebook SDK script');
        reject(new Error('Failed to load Facebook SDK script'));
      };
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
    }, { scope: 'email,public_profile' });
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
      // Handle Facebook Share dialog response properly
      if (response && response.error_code) {
        // Clear error from Facebook
        reject(new Error(response.error_message || 'Facebook sharing failed'));
      } else if (response === null) {
        // User explicitly cancelled
        reject(new Error('User cancelled Facebook sharing'));
      } else if (response === undefined) {
        // Facebook returns undefined for both success and cancellation - unknown outcome
        reject(new Error('Facebook sharing outcome unknown'));
      } else if (response && response.post_id) {
        // Clear success indicator
        resolve();
      } else {
        // Any other case - treat as unknown
        reject(new Error('Facebook sharing outcome unknown'));
      }
    });
  });
};

export const shareToFacebook = (postData: {
  message: string;
  place: string;
  restaurantName: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('Facebook SDK not loaded'));
      return;
    }

    // Create a post mentioning the restaurant using Facebook Share Dialog
    const shareMessage = `🍽️ Just discovered this amazing deal at ${postData.restaurantName}!\n\n${postData.message}\n\nFound through MealScout! #MealScout #FoodDeals`;
    
    window.FB.ui({
      method: 'share',
      href: window.location.origin,
      quote: shareMessage,
    }, (response: any) => {
      // Handle Facebook Share dialog response properly
      if (response && response.error_code) {
        // Clear error from Facebook
        reject(new Error(response.error_message || 'Facebook sharing failed'));
      } else if (response === null) {
        // User explicitly cancelled
        reject(new Error('User cancelled Facebook sharing'));
      } else if (response === undefined) {
        // Facebook returns undefined for both success and cancellation - unknown outcome
        reject(new Error('Facebook sharing outcome unknown'));
      } else if (response && response.post_id) {
        // Clear success indicator
        resolve();
      } else {
        // Any other case - treat as unknown
        reject(new Error('Facebook sharing outcome unknown'));
      }
    });
  });
};