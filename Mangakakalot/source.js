(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);

},{"./Source":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":3,"./models":25}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],24:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":5,"./ChapterDetails":6,"./Constants":7,"./HomeSection":8,"./Languages":9,"./Manga":10,"./MangaTile":11,"./MangaUpdate":12,"./OAuth":13,"./PagedResults":14,"./RequestHeaders":15,"./RequestManager":16,"./RequestObject":17,"./ResponseObject":18,"./SearchRequest":19,"./SourceInfo":20,"./SourceTag":21,"./TagSection":22,"./TrackObject":23,"./UserForm":24}],26:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mangakakalot = exports.MangakakalotInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangakakalotParser_1 = require("./MangakakalotParser");
const ManganeloParser_1 = require("./ManganeloParser");
const MK_DOMAIN = 'https://mangakakalot.com';
const MN_DOMAIN = 'https://manganelo.com';
const method = 'GET';
const headers = {
    "Referer": MN_DOMAIN,
    "content-type": "application/x-www-form-urlencoded"
};
exports.MangakakalotInfo = {
    version: '2.0.2',
    name: 'Mangakakalot',
    icon: 'mangakakalot.com.png',
    author: 'getBoolean',
    authorWebsite: 'https://github.com/getBoolean',
    description: 'Extension that pulls manga from Mangakakalot',
    hentaiSource: false,
    websiteBaseURL: MK_DOMAIN,
    sourceTags: [
        {
            text: "Notifications",
            type: paperback_extensions_common_1.TagType.GREEN
        }
    ]
};
class Mangakakalot extends paperback_extensions_common_1.Source {
    getMangaShareUrl(mangaId) { return `${mangaId}/`; }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let idTemp = mangaId.slice(mangaId.indexOf('/', mangaId.indexOf('/') + 2), mangaId.length);
            let urlDomain = mangaId.replace(idTemp, '');
            const request = createRequestObject({
                url: `${urlDomain}/`,
                method,
                param: idTemp
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            if (mangaId.toLowerCase().includes('mangakakalot')) {
                return MangakakalotParser_1.parseMangakakalotMangaDetails($, mangaId);
            }
            else { // mangaId.toLowerCase().includes('manganelo')
                return ManganeloParser_1.parseManganeloMangaDetails($, mangaId);
            }
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let idTemp = mangaId.slice(mangaId.indexOf('/', mangaId.indexOf('/') + 2), mangaId.length);
            let urlDomain = mangaId.replace(idTemp, '');
            const request = createRequestObject({
                url: `${urlDomain}/`,
                method,
                param: idTemp
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            if (mangaId.toLowerCase().includes('mangakakalot')) {
                return MangakakalotParser_1.parseMangakakalotChapters($, mangaId);
            }
            else { // metadata.id.toLowerCase().includes('manganelo')
                return ManganeloParser_1.parseManganeloChapters($, mangaId);
            }
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request;
            if (mangaId.toLowerCase().includes('manganelo')) {
                request = createRequestObject({
                    url: `${chapterId}`,
                    method,
                    headers: {
                        'Referer': MN_DOMAIN,
                        "content-type": "application/x-www-form-urlencoded",
                        Cookie: 'content_lazyload=off'
                    },
                });
            }
            else {
                request = createRequestObject({
                    url: `${chapterId}`,
                    method,
                    headers: {
                        "content-type": "application/x-www-form-urlencoded",
                        Cookie: 'content_lazyload=off'
                    },
                });
            }
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            if (mangaId.toLowerCase().includes('mangakakalot')) {
                return MangakakalotParser_1.parseMangakakalotChapterDetails($, mangaId, chapterId);
            }
            else { // metadata.mangaId.toLowerCase().includes('manganelo')
                return ManganeloParser_1.parseManganeloChapterDetails($, mangaId, chapterId);
            }
        });
    }
    // Mangakakalot does not show the updated date on their latest updates page, so return all ids
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            mangaUpdatesFoundCallback(createMangaUpdates({
                ids: ids
            }));
        });
    }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            // Give Paperback a skeleton of what these home sections should look like to pre-render them
            const section1 = createHomeSection({ id: 'popular_manga', title: 'POPULAR MANGA' });
            const section2 = createHomeSection({ id: 'latest_updates', title: 'LATEST MANGA RELEASES', view_more: true });
            const section3 = createHomeSection({ id: 'hot_manga', title: 'HOT MANGA', view_more: true });
            const section4 = createHomeSection({ id: 'new_manga', title: 'NEW MANGA', view_more: true });
            const section5 = createHomeSection({ id: 'zcompleted_manga', title: 'COMPLETED MANGA', view_more: true });
            // Fill the homsections with data
            const request1 = createRequestObject({
                url: `${MK_DOMAIN}`,
                method: 'GET'
            });
            const request3 = createRequestObject({
                url: `${MK_DOMAIN}/manga_list?type=topview&category=all&state=all&page=`,
                method: 'GET'
            });
            const request4 = createRequestObject({
                url: `${MK_DOMAIN}/manga_list?type=newest&category=all&state=all&page=`,
                method: 'GET'
            });
            const request5 = createRequestObject({
                url: `${MK_DOMAIN}/manga_list?type=newest&category=all&state=Completed&page=`,
                method: 'GET'
            });
            const response1 = yield this.requestManager.schedule(request1, 1);
            const $1 = this.cheerio.load(response1.data);
            const response3 = yield this.requestManager.schedule(request3, 1);
            const $3 = this.cheerio.load(response3.data);
            const response4 = yield this.requestManager.schedule(request4, 1);
            const $4 = this.cheerio.load(response4.data);
            const response5 = yield this.requestManager.schedule(request5, 1);
            const $5 = this.cheerio.load(response5.data);
            MangakakalotParser_1.parseHomeSections($1, [section1, section2], sectionCallback);
            MangakakalotParser_1.parseMangaSectionTiles($3, [section3], sectionCallback);
            MangakakalotParser_1.parseMangaSectionTiles($4, [section4], sectionCallback);
            MangakakalotParser_1.parseMangaSectionTiles($5, [section5], sectionCallback);
        });
    }
    searchRequest(query, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const search = MangakakalotParser_1.generateSearch(query);
            const request = createRequestObject({
                url: `${MK_DOMAIN}/search/story/`,
                method,
                headers,
                param: `${search}?page=${page}`
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = MangakakalotParser_1.parseSearch($);
            metadata = !MangakakalotParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: MK_DOMAIN,
                method,
                headers,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangakakalotParser_1.parseTags($);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let param = '';
            switch (homepageSectionId) {
                case 'latest_updates':
                    param = `/manga_list?type=latest&category=all&state=all&page=${page}`;
                    //console.log('param: ' + param)
                    break;
                case 'hot_manga':
                    param = `/manga_list?type=topview&category=all&state=all&page=${page}`;
                    break;
                case 'new_manga':
                    param = `/manga_list?type=newest&category=all&state=all&page=${page}`;
                    break;
                case 'zcompleted_manga':
                    param = `/manga_list?type=newest&category=all&state=Completed&page=${page}`;
                    break;
                default:
                    return Promise.resolve(null);
            }
            const request = createRequestObject({
                url: MK_DOMAIN,
                method,
                param,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = MangakakalotParser_1.parseViewMore($);
            metadata = !MangakakalotParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    globalRequestHeaders() {
        return {
            referer: MN_DOMAIN
        };
    }
}
exports.Mangakakalot = Mangakakalot;

},{"./MangakakalotParser":27,"./ManganeloParser":28,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseViewMore = exports.parseTags = exports.parseSearch = exports.generateSearch = exports.parseMangaSectionTiles = exports.parseHomeSections = exports.parseMangakakalotChapterDetails = exports.parseMangakakalotChapters = exports.parseMangakakalotMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
exports.parseMangakakalotMangaDetails = ($, mangaId) => {
    var _a, _b, _c;
    const panel = $('.manga-info-top');
    const title = (_a = $('h1', panel).first().text()) !== null && _a !== void 0 ? _a : '';
    const image = (_b = $('.manga-info-pic', panel).children().first().attr('src')) !== null && _b !== void 0 ? _b : '';
    const table = $('.manga-info-text', panel);
    let author = '';
    let artist = '';
    let autart = $('.manga-info-text li:nth-child(2)').text().replace('Author(s) :', '').replace(/\r?\n|\r/g, '').split(', ');
    autart[autart.length - 1] = (_c = autart[autart.length - 1]) === null || _c === void 0 ? void 0 : _c.replace(', ', '');
    author = autart[0];
    if (autart.length > 1 && $(autart[1]).text() != ' ') {
        artist = autart[1];
    }
    const rating = Number($('#rate_row_cmd', table).text().replace('Mangakakalot.com rate : ', '').slice($('#rate_row_cmd', table).text().indexOf('Mangakakalot.com rate : '), $('#rate_row_cmd', table).text().indexOf(' / 5')));
    const status = $('.manga-info-text li:nth-child(3)').text().split(' ').pop() == 'Ongoing' ? paperback_extensions_common_1.MangaStatus.ONGOING : paperback_extensions_common_1.MangaStatus.COMPLETED;
    let titles = [title];
    const follows = Number($('#rate_row_cmd', table).text().replace(' votes', '').split(' ').pop());
    const views = Number($('.manga-info-text li:nth-child(6)').text().replace(/,/g, '').replace('View : ', ''));
    let hentai = false;
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] })];
    // Genres
    let elems = $('.manga-info-text li:nth-child(7)').find('a').toArray();
    let genres = [];
    genres = Array.from(elems, x => $(x).text());
    tagSections[0].tags = genres.map((elem) => createTag({ id: elem, label: elem }));
    hentai = (genres.includes('Adult') || genres.includes('Smut')) ? true : false;
    // Alt Titles
    for (let row of $('li', table).toArray()) {
        if ($(row).find('.story-alternative').length > 0) {
            let alts = $('h2', table).text().replace('Alternative : ', '').split(/,|;/);
            for (let alt of alts) {
                titles.push(alt.trim());
            }
        }
    }
    // Date
    const time = new Date($('.manga-info-text li:nth-child(4)').text().replace(/((AM)*(PM)*)/g, '').replace('Last updated : ', ''));
    const lastUpdate = time.toDateString();
    // Exclude child text: https://www.viralpatel.net/jquery-get-text-element-without-child-element/
    // Remove line breaks from start and end: https://stackoverflow.com/questions/14572413/remove-line-breaks-from-start-and-end-of-string
    const summary = $('#noidungm', $('.leftCol'))
        .clone() //clone the element
        .children() //select all the children
        .remove() //remove all the children
        .end() //again go back to selected element
        .text().replace(/^\s+|\s+$/g, '');
    return createManga({
        id: mangaId,
        titles,
        image,
        rating: Number(rating),
        status,
        artist,
        author,
        tags: tagSections,
        views,
        follows,
        lastUpdate,
        desc: summary,
        hentai
    });
};
exports.parseMangakakalotChapters = ($, mangaId) => {
    var _a, _b, _c;
    const allChapters = $('.chapter-list', '.leftCol');
    const chapters = [];
    for (let chapter of $('.row', allChapters).toArray()) {
        const id = (_a = $('a', chapter).attr('href')) !== null && _a !== void 0 ? _a : '';
        const name = (_b = $('a', chapter).text()) !== null && _b !== void 0 ? _b : '';
        const chapNum = Number(id.split('_').pop());
        const time = new Date((_c = $('span:nth-child(3)', chapter).attr('title')) !== null && _c !== void 0 ? _c : '');
        chapters.push(createChapter({
            id,
            mangaId,
            name,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum,
            time
        }));
    }
    return chapters;
};
exports.parseMangakakalotChapterDetails = ($, mangaId, chapterId) => {
    const pages = [];
    const allItems = $('img', '.container-chapter-reader').toArray();
    for (let item of allItems) {
        let page = $(item).attr('src');
        // If page is undefined, dont push it
        if (typeof page === 'undefined')
            continue;
        pages.push(page);
    }
    return createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages,
        longStrip: false
    });
};
// Removed: Mangakakalot does not show the updated date on their latest updates page
// export const parseUpdatedManga = ($: CheerioStatic, time: Date, ids: string[]): UpdatedManga => {
// }
exports.parseHomeSections = ($, sections, sectionCallback) => {
    for (const section of sections)
        sectionCallback(section);
    const popularManga = [];
    const latestManga = [];
    // Popular manga
    for (const item of $('.item', '.owl-carousel').toArray()) {
        let url = $('a', item).first().attr('href');
        let image = $('img', item).attr('src');
        let title = $('div.slide-caption', item).children().first().text();
        let subtitle = $('div.slide-caption', item).children().last().text();
        // Credit to @GameFuzzy
        // Checks for when no id or image found
        if (typeof url === 'undefined' || typeof image === 'undefined')
            continue;
        popularManga.push(createMangaTile({
            id: url,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle })
        }));
    }
    // Latest updates
    for (const item of $('.first', '.doreamon').toArray()) {
        let url = $('a', item).first().attr('href');
        let image = $('img', item).attr('src');
        //console.log(image)
        // Credit to @GameFuzzy
        // Checks for when no id or image found
        if (typeof url === 'undefined' || typeof image === 'undefined')
            continue;
        latestManga.push(createMangaTile({
            id: url,
            image: image,
            title: createIconText({ text: $('h3', item).text() }),
            subtitleText: createIconText({ text: $('.sts_1', item).first().text() }),
        }));
    }
    sections[0].items = popularManga;
    sections[1].items = latestManga;
    // Perform the callbacks again now that the home page sections are filled with data
    for (const section of sections)
        sectionCallback(section);
};
exports.parseMangaSectionTiles = ($, sections, sectionCallback) => {
    for (const section of sections)
        sectionCallback(section);
    sections[0].items = parseTiles($);
    // Perform the callbacks again now that the home page sections are filled with data
    for (const section of sections)
        sectionCallback(section);
};
const parseTiles = ($) => {
    var _a, _b;
    const manga = [];
    let panel = $('.truyen-list');
    for (const item of $('.list-truyen-item-wrap', panel).toArray()) {
        let id = $('a', item).first().attr('href');
        let image = $('img', item).first().attr('src');
        //console.log(image)
        let title = (_a = $('a', item).first().attr('title')) !== null && _a !== void 0 ? _a : '';
        let subtitle = (_b = $('.list-story-item-wrap-chapter', item).attr('title')) !== null && _b !== void 0 ? _b : '';
        // Credit to @GameFuzzy
        // Checks for when no id or image found
        if (typeof id === 'undefined' || typeof image === 'undefined')
            continue;
        manga.push(createMangaTile({
            id: id,
            image: image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subtitle })
        }));
    }
    return manga;
};
exports.generateSearch = (query) => {
    var _a, _b;
    let keyword = ((_a = query.title) !== null && _a !== void 0 ? _a : '').replace(/ /g, '_');
    if (query.author)
        keyword += ((_b = query.author) !== null && _b !== void 0 ? _b : '').replace(/ /g, '_');
    let search = `${keyword}`;
    return search;
};
exports.parseSearch = ($) => {
    var _a, _b;
    const manga = [];
    const panel = $('.panel_story_list');
    const items = $('.story_item', panel).toArray();
    for (const item of items) {
        const id = (_a = $('a', item).first().attr('href')) !== null && _a !== void 0 ? _a : '';
        const title = $('.story_name', item).children().first().text();
        const subTitle = $('.story_chapter', item).first().text().trim();
        const image = (_b = $('img', item).attr('src')) !== null && _b !== void 0 ? _b : '';
        // let rating = '0'
        const time = new Date($('.story_item_right span:nth-child(5)', item).text().replace(/((AM)*(PM)*)/g, '').replace('Updated : ', ''));
        const updated = time.toDateString();
        manga.push(createMangaTile({
            id,
            image,
            title: createIconText({ text: title }),
            subtitleText: createIconText({ text: subTitle }),
            // primaryText: createIconText({ text: rating, icon: 'star.fill' }),
            secondaryText: createIconText({ text: updated, icon: 'clock.fill' })
        }));
    }
    return manga;
};
exports.parseTags = ($) => {
    const panel = $('.panel-category');
    const items = panel.find('a').clone().remove('.ctg-select').toArray();
    const genres = createTagSection({
        id: 'genre',
        label: 'Genre',
        tags: []
    });
    for (let item of items) {
        let label = $(item).text();
        genres.tags.push(createTag({ id: label, label: label }));
    }
    return [genres];
};
exports.parseViewMore = ($) => {
    return parseTiles($);
};
exports.isLastPage = ($) => {
    var _a;
    let current = $('.page_select').text();
    let total = $('.page_last').text();
    if (current) {
        total = ((_a = /(\d+)/g.exec(total)) !== null && _a !== void 0 ? _a : [''])[0];
        return (+total) === (+current);
    }
    return true;
};

},{"paperback-extensions-common":4}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseManganeloChapterDetails = exports.parseManganeloChapters = exports.parseManganeloMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
exports.parseManganeloMangaDetails = ($, mangaId) => {
    var _a, _b;
    const panel = $('.panel-story-info');
    const title = (_a = $('.img-loading', panel).attr('title')) !== null && _a !== void 0 ? _a : '';
    const image = (_b = $('.img-loading', panel).attr('src')) !== null && _b !== void 0 ? _b : '';
    let table = $('.variations-tableInfo', panel);
    let author = '';
    let artist = '';
    let rating = 0;
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    let titles = [title];
    let follows = 0;
    let views = 0;
    let lastUpdate = '';
    let hentai = false;
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] })];
    for (const row of $('tr', table).toArray()) {
        if ($(row).find('.info-alternative').length > 0) {
            const alts = $('h2', table).text().split(/,|;/);
            for (const alt of alts) {
                titles.push(alt.trim());
            }
        }
        else if ($(row).find('.info-author').length > 0) {
            const autart = $('.table-value', row).find('a').toArray();
            author = $(autart[0]).text();
            if (autart.length > 1) {
                artist = $(autart[1]).text();
            }
        }
        else if ($(row).find('.info-status').length > 0) {
            status = $('.table-value', row).text() == 'Ongoing' ? paperback_extensions_common_1.MangaStatus.ONGOING : paperback_extensions_common_1.MangaStatus.COMPLETED;
        }
        else if ($(row).find('.info-genres').length > 0) {
            let elems = $('.table-value', row).find('a').toArray();
            let genres = [];
            for (let elem of elems) {
                let text = $(elem).text();
                if (text.toLowerCase().includes('smut')) {
                    hentai = true;
                }
                genres.push(text);
            }
            tagSections[0].tags = genres.map((elem) => createTag({ id: elem, label: elem }));
        }
    }
    table = $('.story-info-right-extent', panel);
    for (const row of $('p', table).toArray()) {
        if ($(row).find('.info-time').length > 0) {
            const time = new Date($('.stre-value', row).text().replace(/(-*(AM)*(PM)*)/g, ''));
            lastUpdate = time.toDateString();
        }
        else if ($(row).find('.info-view').length > 0) {
            views = Number($('.stre-value', row).text().replace(/,/g, ''));
        }
    }
    rating = Number($('[property=v\\:average]', table).text());
    follows = Number($('[property=v\\:votes]', table).text());
    const summary = $('.panel-story-info-description', panel).text();
    return createManga({
        id: mangaId,
        titles,
        image,
        rating: Number(rating),
        status,
        artist,
        author,
        tags: tagSections,
        views,
        follows,
        lastUpdate,
        desc: summary,
        //hentai
        hentai: false
    });
};
exports.parseManganeloChapters = ($, mangaId) => {
    var _a, _b, _c, _d, _e;
    const allChapters = $('.row-content-chapter', '.body-site');
    const chapters = [];
    for (let chapter of $('li', allChapters).toArray()) {
        const id = (_a = $('a', chapter).attr('href')) !== null && _a !== void 0 ? _a : '';
        const name = (_b = $('a', chapter).text()) !== null && _b !== void 0 ? _b : '';
        const chapNum = Number((_d = ((_c = /Chapter (\d*)/g.exec(name)) !== null && _c !== void 0 ? _c : [])[1]) !== null && _d !== void 0 ? _d : '');
        const time = new Date((_e = $('.chapter-time', chapter).attr('title')) !== null && _e !== void 0 ? _e : '');
        chapters.push(createChapter({
            id,
            mangaId,
            name,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum,
            time
        }));
    }
    return chapters;
};
exports.parseManganeloChapterDetails = ($, mangaId, chapterId) => {
    const pages = Array.from($('img', '.container-chapter-reader').toArray(), x => { var _a; return (_a = $(x).attr('src')) !== null && _a !== void 0 ? _a : ''; });
    return createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages,
        longStrip: false
    });
};

},{"paperback-extensions-common":4}]},{},[26])(26)
});
