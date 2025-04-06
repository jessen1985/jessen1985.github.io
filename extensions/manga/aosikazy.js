const mangayomiSources = [{
    "name": "奥斯卡资源站",
    "lang": "zh",
    "baseUrl": "https://aosikazy.com",
    "apiUrl": "",
    "iconUrl": "https://aosikazy.com/template/m1938pc3/image/logo.gif",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": false,
    "version": "0.0.2",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/zh/aosikazy.js"
}];

class DefaultExtension extends MProvider {
    dict = new Map([
        ["&nbsp;", " "],
        ["&quot;", '"'],
        ["&lt;", "<"],
        ["&gt;", ">"],
        ["&amp;", "&"],
        ["&sdot;", "·"],
    ]);
    text(content) {
        if (!content) return "";
        const str =
            [...content.matchAll(/>([^<]+?)</g)]
                .map((m) => m[1])
                .join("")
                .trim() || content;
        return str.replace(/&[a-z]+;/g, (c) => this.dict.get(c) || c);
    }
    async request(url) {
        const preference = new SharedPreferences();
        return (await new Client({ 'useDartHttpClient': true }).get(preference.get("url") + "/api.php/provide/vod?ac=detail" + url, { "Referer": preference.get("url") })).body;
    }
    getHeaders(url) {
        throw new Error("getHeaders not implemented");
    }
    async getPopular(page) {
        // let genres = [];
        // const gen = JSON.parse(await this.request("&ac=list"));
        // gen.class.forEach((e) => {
        //     genres.push({
        //         type_name: "SelectOption",
        //         value: e.type_id,
        //         name: e.type_name
        //     });
        // });
        // console.log(genres)
        const res = JSON.parse(await this.request(`&pg=${page}`));
        return {
            list: res.list.map((e) => ({
                link: "&ids=" + e.vod_id,
                imageUrl: e.vod_pic,
                name: e.vod_name
            })),
            hasNextPage: true
        };
    }
    async getLatestUpdates(page) {
        const h = (new Date().getUTCHours() + 9) % 24;
        const res = JSON.parse(await this.request(`&pg=${page}&h=${h || 24}`));
        return {
            list: res.list.map((e) => ({
                link: "&ids=" + e.vod_id,
                imageUrl: e.vod_pic,
                name: e.vod_name
            })),
            hasNextPage: true
        };
    }
    async search(query, page, filters) {
        var categories;
        for (const filter of filters) {
            if (filter["type"] == "categories") {
                categories = filter["values"][filter["state"]]["value"];
            }
        }
        const res = JSON.parse(await this.request(`&wd=${query}&t=${categories ?? ""}&pg=${page}`));
        return {
            list: res.list.map((e) => ({
                link: "&ids=" + e.vod_id,
                imageUrl: e.vod_pic,
                name: e.vod_name
            })),
            hasNextPage: true
        };
    }
    async getDetail(url) {
        let desc = "无";
        const anime = JSON.parse(await this.request(url)).list[0];
        const blurb = this.text(anime.vod_blurb);
        const content = this.text(anime.vod_content);
        desc = desc.length < blurb?.length ? blurb : desc;
        desc = desc.length < content.length ? content : desc;

        const playLists = anime.vod_play_url.split("$$$");
        const urls = [];

        for (const playList of playLists) {
            const episodes = playList.split("#").filter(e => e);

            for (const episode of episodes) {
                const parts = episode.split("$");
                const name = parts[0];
                const episodeUrl = parts[1];
                if (episodeUrl.includes("m3u8")) {
                    urls.push({ name, url: episodeUrl });
                }
            }
        }
        return {
            name: anime.vod_name,
            imageUrl: anime.vod_pic,
            description: desc,
            episodes: urls
        };
    }
    // For anime episode video list
    async getVideoList(url) {
        return [
            {
                url: url,
                originalUrl: url,
                quality: "HLS"
            }
        ];
    }
    // For manga chapter pages
    async getPageList() {
        throw new Error("getPageList not implemented");
    }
    getFilterList() {
        return [{
            type: "categories",
            name: "影片类型",
            type_name: "SelectFilter",
            values: [
                { type_name: "SelectOption", value: "", name: "全部" },
                { type_name: "SelectOption", value: "34", name: "视频二区" },
                { type_name: "SelectOption", value: "20", name: "国产视频" },
                { type_name: "SelectOption", value: "29", name: "激情动漫" },
                { type_name: "SelectOption", value: "30", name: "明星换脸" },
                { type_name: "SelectOption", value: "31", name: "抖阴视频" },
                { type_name: "SelectOption", value: "32", name: "女优明星" },
                { type_name: "SelectOption", value: "35", name: "网曝黑料" },
                { type_name: "SelectOption", value: "45", name: "人妖系列" },
            ]
        }];
    }
    getSourcePreferences() {
        return [
            {
                "key": "url",
                "listPreference": {
                    "title": "Website Url",
                    "summary": "",
                    "valueIndex": 0,
                    "entries": ["aosikazy.com"],
                    "entryValues": ["https://aosikazy.com"],
                }
            }
        ];
    }
}
