import { fetch } from 'cross-fetch';
import { Client } from './client.js';
import * as urls from './util/urls.js';

const renameMap = {
    full: 'body',
};

const ENDPOINTS = {
    me() {
        return '/users/me';
    },
    getMyShares(hardware, app, limit = 1000) {
        return `/users/me/shares?hardware=${hardware}&app=${app}&limit=${limit}`;
    },
    userById(id) {
        return `/users/${id}`;
    },
    userByUsername(username) {
        return `/users/?username=${username}`;
    },
    getListByIds(ids) {
        return `/users?ids=${ids.join(',')}`;
    },
    getFollows(id) {
        return `/users/${id}/follows`;
    },
    getLikes(id) {
        return `/users/${id}/likes`;
    },
    getAvatar(ctx) {
        return `/users/avatar?ctx=${ctx}`;
    },
    getAvatarById(id) {
        return `/users/${id}/avatar`;
    },
    getUserSettings() {
        return '/users/settings';
    },
    putAvatar(context, avatarData) {
        let dbData = {};

        if(context === 'kano-studio') {
            const { assets, skinColor, hairColor, backgroundColor, backgroundPattern } = avatarData;
            dbData = {
                assets,
                skinColor,
                hairColor,
                backgroundColor,
                backgroundPattern
            };
        } else {
            const { colorEls, slots, hiddenBones } = avatarData;
            dbData = {
                colorEls,
                slots,
                hiddenBones,
            };
        }

        return {
            path: `/users/avatar?ctx=${context}`,
            method: 'PUT',
            body: JSON.stringify(dbData),
            params: { avatarData },
        };
    },
    follow(id) {
        return {
            path: `/users/following/${id}`,
            method: 'POST',
        };
    },
    unfollow(id) {
        return {
            path: `/users/following/${id}`,
            method: 'DELETE',
            responseType: 'text',
        };
    },
    updateBio(bio) {
        return {
            path: '/users/bio',
            method: 'PUT',
            body: JSON.stringify({
                bio,
            }),
        };
    },
    getFlags() {
        return '/users/flags';
    },
    updateRoles(id, update) {
        return {
            path: `/users/${id}/roles`,
            method: 'PATCH',
            body: JSON.stringify(update),
        };
    },
};

function normalizeFollows(follows) {
    const following = follows.following.map((user) => {
        user.avatar = urls.userAvatar(user.id, follows.aBurl);
        user.avatarFull = urls.userAvatarFull(user.id, follows.aBurl);
        return user;
    });
    const followers = follows.followers.map((user) => {
        user.avatar = urls.userAvatar(user.id, follows.aBurl);
        user.avatarFull = urls.userAvatarFull(user.id, follows.aBurl);
        return user;
    });
    return { following, followers };
}
function expandUser(user, avatarBaseUrl) {
    // Add avatar keys to the user object this will disappear as
    // avatar are now scoped with a context and should be computed using static methods
    if (!user.avatar) {
        user.avatar = urls.userAvatar(user.id, avatarBaseUrl);
    }
    if (!user.avatarFull) {
        user.avatarFull = urls.userAvatarFull(user.id, avatarBaseUrl);
    }
    return user;
}

export class UserClient extends Client {
    constructor(opts = {}) {
        super(opts);
        this.addEndpoints(ENDPOINTS);
    }

    static getAvatarsForUserWithContext(user, aBurl, context) {
        return {
            head: urls.userAvatar(user.id, aBurl, context),
            full: urls.userAvatarFull(user.id, aBurl, context),
        };
    }

    me(token = null) {
        const endpoint = this.getEndpoint('me');
        if (token) {
            endpoint.headers.append('Authorization', `Bearer ${token}`);
        }
        return this.fetch(endpoint)
            .then(res => expandUser(res.data.user, res.data.aBurl))
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getMyShares(hardware, app, limit, token = null) {
        const endpoint = this.getEndpoint('getMyShares', hardware, app, limit);
        if (token) {
            endpoint.headers.append('Authorization', `Bearer ${token}`);
        }
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getById(id) {
        const endpoint = this.getEndpoint('userById', id);
        return this.fetch(endpoint)
            .then(res => expandUser(res.data.user, res.data.aBurl))
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getByUsername(username) {
        const endpoint = this.getEndpoint('userByUsername', username);
        return this.fetch(endpoint)
            .then(res => expandUser(res.data.user, res.data.aBurl))
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getListByIds(ids) {
        const endpoint = this.getEndpoint('getListByIds', ids);
        return this.fetch(endpoint)
            .then(res => res.data.users.map(user => expandUser(user, res.data.aBurl)))
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getFollows(id) {
        const endpoint = this.getEndpoint('getFollows', id);
        return this.fetch(endpoint)
            .then(res => normalizeFollows(res.data))
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getLikes(id) {
        const endpoint = this.getEndpoint('getLikes', id);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    follow(id) {
        const endpoint = this.getEndpoint('follow', id);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    unfollow(id) {
        const endpoint = this.getEndpoint('unfollow', id);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    updateBio(id) {
        const endpoint = this.getEndpoint('updateBio', id);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getAvatar(ctx) {
        const endpoint = this.getEndpoint('getAvatar', ctx);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getAvatarById(id) {
        const endpoint = this.getEndpoint('getAvatarById', id);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    getUserSettings() {
        const endpoint = this.getEndpoint('getUserSettings');
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    putAvatarWithContext(ctx, avatarData) {
        const { images } = avatarData;
        const endpoint = this.getEndpoint('putAvatar', ctx, avatarData);
        return this.fetch(endpoint)
            .then(res => res.data)
            .then((data) => {
                this.afterDataProcessed(endpoint, data);
                return data.aurls;
            })
            .then((avatarUrls) => {
                const upload = (image, url) => fetch(url, {
                    method: 'put',
                    body: image,
                    headers: {
                        'Content-Type': 'image/png',
                    },
                });
                const promises = avatarUrls.map((url) => {
                    const actualKey = renameMap[url.key] || url.key;
                    return upload(images[actualKey], url.url);
                });
                return Promise.all(promises);
            });
    }

    putAvatar(_uid, avatarData) {
        return this.putAvatarWithContext('wand', avatarData);
    }

    getFlags() {
        const endpoint = this.getEndpoint('getFlags');
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    addRole(id, role) {
        const endpoint = this.getEndpoint('updateRoles', id, { add: [role] });
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }

    removeRole(id, role) {
        const endpoint = this.getEndpoint('updateRoles', id, { remove: [role] });
        return this.fetch(endpoint)
            .then(res => res.data)
            .then(data => this.afterDataProcessed(endpoint, data));
    }
}

export default UserClient;
