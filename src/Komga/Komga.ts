import {
  Source,
  Manga,
  Chapter,
  ChapterDetails,
  HomeSection,
  SearchRequest,
  LanguageCode,
  MangaStatus,
  MangaUpdates,
  PagedResults,
  SourceInfo,
  RequestHeaders,
  TagSection,
  UserForm,
  FormObject
} from "paperback-extensions-common"

const KOMGA_DOMAIN = 'https://demo.komga.org/api/v1'
//const KOMGA_DOMAIN = 'http://192.168.0.23:8081'
const KOMGA_USERNAME = "demo@komga.org"
const KOMGA_PASSWORD = "komga-demo"

const KOMGA_API_DOMAIN = KOMGA_DOMAIN + "/api/v1"
const AUTHENTIFICATION = "Basic " + Buffer.from(KOMGA_USERNAME + ":" + KOMGA_PASSWORD, 'binary').toString('base64')

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]

export const parseMangaStatus = (komgaStatus: string) => {
  switch (komgaStatus) {
    case "ENDED":
      return MangaStatus.COMPLETED  
    case "ONGOING":
      return MangaStatus.ONGOING
    case "ABANDONED":
      return MangaStatus.ONGOING
    case "HIATUS":
      return MangaStatus.ONGOING
  }
  return MangaStatus.ONGOING
}

export const KomgaInfo: SourceInfo = {
  version: "1.1.1",
  name: "Komga",
  icon: "icon.png",
  author: "Lemon",
  authorWebsite: "https://github.com/FramboisePi",
  description: "Extension that pulls manga from Komga demo server",
  //language: ,
  hentaiSource: false,
  websiteBaseURL: "https://komga.org"
}

export class Komga extends Source {

  async getAuthorizationString(): Promise<string>{
    const username = await this.stateManager.retrieve("serverUsername")
    const password = await this.stateManager.retrieve("serverPassword")

    return "Basic " + Buffer.from(username + ":" + password, 'binary').toString('base64')
  }

  async getKomgaAPI(): Promise<string>{
    const serverAddress = await this.stateManager.retrieve("serverAddress")
    return serverAddress + (serverAddress.slice(-1) === "/" ? "api/v1" : "/api/v1")
  }

  async globalRequestHeaders(): Promise<RequestHeaders> { 
    return {
      authorization: await this.getAuthorizationString()
    }
  }

  async getMangaDetails(mangaId: string): Promise<Manga> {
    /*
      In Komga a manga is represented by a `serie`
     */
    const komgaAPI = await this.getKomgaAPI()

    let request = createRequestObject({
      url: `${komgaAPI}/series/${mangaId}/`,
      method: "GET",
      headers: {authorization: await this.getAuthorizationString()}
    })

    const response = await this.requestManager.schedule(request, 1)
    const result = typeof response.data === "string" ? JSON.parse(response.data) : response.data
    const metadata = result.metadata
    const booksMetadata = result.booksMetadata

    const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: [] }),
                                       createTagSection({ id: '1', label: 'tags', tags: [] })]
    tagSections[0].tags = metadata.genres.map((elem: string) => createTag({ id: elem, label: elem }))
    tagSections[1].tags = metadata.tags.map((elem: string) => createTag({ id: elem, label: elem }))

    let authors: string[] = []
    let artists: string[] = []

    // Other are ignored
    for (let entry of booksMetadata.authors) {
      if (entry.role === "writer") {
        authors.push(entry.name)
      }
      if (entry.role === "penciller") {
        artists.push(entry.name)
      }
    }

    return createManga({
      id: mangaId,
      titles: [metadata.title],
      image: `${komgaAPI}/series/${mangaId}/thumbnail`,
      rating: 5,
      status: parseMangaStatus(metadata.status),
      langFlag: metadata.language,
      //langName:,
      
      artist: artists.join(", "),
      author: authors.join(", "),

      desc: (metadata.summary ? metadata.summary : booksMetadata.summary),
      tags: tagSections,
      lastUpdate: metadata.lastModified
    })
}


  async getChapters(mangaId: string): Promise<Chapter[]> {
    /*
      In Komga a chapter is a `book`
     */

    const komgaAPI = await this.getKomgaAPI()

    let request = createRequestObject({
      url: `${komgaAPI}/series/${mangaId}/books`,
      param: "?unpaged=true&media_status=READY",
      method: "GET",
      headers: {authorization: await this.getAuthorizationString()}
    })

    const response = await this.requestManager.schedule(request, 1)
    const result = typeof response.data === "string" ? JSON.parse(response.data) : response.data
    
    let chapters: Chapter[] = []

    for (let book of result.content) {
      chapters.push(
        createChapter({
          id: book.id,
          mangaId: mangaId,
          chapNum: book.metadata.numberSort,
          // TODO: langCode
          langCode: LanguageCode.ENGLISH,
          name: `${book.metadata.number} - ${book.metadata.title} (${book.size})`,          
          time: new Date(book.fileLastModified),
        })
      )
    }

    return chapters
  }

  async getChapterDetails(mangaId: string, chapterId: string): Promise<ChapterDetails> {

    const komgaAPI = await this.getKomgaAPI()
    const authorizationString = await this.getAuthorizationString()

    const request = createRequestObject({
      url: `${komgaAPI}/books/${chapterId}/pages`,
      method: "GET",
      headers: {authorization: authorizationString}
    })

    const data = await this.requestManager.schedule(request, 1)
    const result = typeof data.data === "string" ? JSON.parse(data.data) : data.data
    
    
    let pages: string[] = []
    for (let page of result) {
      if (SUPPORTED_IMAGE_TYPES.includes(page.mediaType)) {
        pages.push(`${komgaAPI}/books/${chapterId}/pages/${page.number}`)
      } else {
        pages.push(`${komgaAPI}/books/${chapterId}/pages/${page.number}?convert=png`)
      }
    }
    
    // Determine the preferred reading direction which is only available in the serie metadata
    let serieRequest = createRequestObject({
      url: `${komgaAPI}/series/${mangaId}/`,
      method: "GET",
      headers: {authorization: authorizationString}
    })

    const serieResponse = await this.requestManager.schedule(serieRequest, 1)
    const serieResult = typeof serieResponse.data === "string" ? JSON.parse(serieResponse.data) : serieResponse.data

    let longStrip = false
    if (["VERTICAL", "WEBTOON"].includes(serieResult.metadata.readingDirection)) {
      longStrip = true
    }

    return createChapterDetails({
      id: chapterId,
      longStrip: longStrip,
      mangaId: mangaId,
      pages: pages,
    })
  }


  async searchRequest(searchQuery: SearchRequest, metadata: any): Promise<PagedResults> {

    const komgaAPI = await this.getKomgaAPI()

    let paramsList = ["unpaged=true"]

    if (searchQuery.title !== undefined) {
      paramsList.push("search=" + searchQuery.title.replace(" ", "%20"))
    }
    /*
    if (query.status !== undefined) {
      paramsList.push("status=" + KOMGA_STATUS_LIST[query.status])
    }
    */

    let paramsString = ""
    if (paramsList.length > 0) {
      paramsString = "?" + paramsList.join("&");
    }

    const request = createRequestObject({
      url: `${komgaAPI}/series`,
      method: "GET",
      param: paramsString,
      headers: {authorization: await this.getAuthorizationString()}
    })

    const data = await this.requestManager.schedule(request, 1)

    let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

    let tiles = []
    for (let serie of result.content) {
      tiles.push(createMangaTile({
        id: serie.id,
        title: createIconText({ text: serie.metadata.title }),
        image: `${komgaAPI}/series/${serie.id}/thumbnail`,
        subtitleText: createIconText({ text: "id: " + serie.id }),
      }))
    }

    return createPagedResults({
      results: tiles
    })
  }

  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    
    const komgaAPI = await this.getKomgaAPI()
    const authorizationString = await this.getAuthorizationString()

    // Use ?paged=true ?
    const sections = [
      {
        request: createRequestObject({
          url: `${komgaAPI}/series/new`,
          method: "GET",
          headers: {authorization: authorizationString}
        }),
        section: createHomeSection({
            id: 'new',
            title: 'Recently added series',
            //view_more: true,
        }),
    },
    {
      request: createRequestObject({
        url: `${komgaAPI}/series/updated`,
        method: "GET",
        headers: {authorization: authorizationString}
      }),
      section: createHomeSection({
          id: 'updated',
          title: 'Recently updated series',
          //view_more: true,
      }),
  },
  ]

  const promises: Promise<void>[] = []

  for (const section of sections) {
      // Let the app load empty tagSections
      sectionCallback(section.section)

      // Get the section data
      promises.push(
          this.requestManager.schedule(section.request, 1).then(data => {
              
            let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

            let tiles = []
            for (let serie of result.content) {
              tiles.push(createMangaTile({
                id: serie.id,
                title: createIconText({ text: serie.metadata.title }),
                image: `${komgaAPI}/series/${serie.id}/thumbnail`,
                subtitleText: createIconText({ text: "id: " + serie.id }),
              }))
            }
            section.section.items = tiles
            sectionCallback(section.section)
          }),
      )
  }

  // Make sure the function completes
  await Promise.all(promises)
  }

  async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {

    const komgaAPI = await this.getKomgaAPI()

    const request = createRequestObject({
      url: `${komgaAPI}/series/updated/`,
      method: "GET",
      headers: {authorization: await this.getAuthorizationString()}
    })

    const data = await this.requestManager.schedule(request, 1)
    let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

    let foundIds: string[] = []

    for (let serie of result.content) {
      let serieUpdated = new Date(serie.metadata.lastModified)
      if (
        serieUpdated >= time &&
        ids.includes(serie)
      ) {
        foundIds.push(serie)
      }
    }
    mangaUpdatesFoundCallback(createMangaUpdates({ ids: foundIds }))
  }

  /*
  getMangaShareUrl(mangaId: string) {
    return `${KOMGA_API_DOMAIN}/series/${mangaId}`
  }
  */

  async getAppStatefulForm(): Promise<UserForm> {
    
    let objects: FormObject[] = []
    
    objects.push(createTextFieldObject({
      id: 'serverAddress',
      userReadableTitle: 'Server URL',
      placeholderText: 'http://127.0.0.1:8080',
      userResponse: await this.stateManager.retrieve('serverAddress')
    }))

    objects.push(createTextFieldObject({
      id: 'serverUsername',
      userReadableTitle: 'Username',
      placeholderText: 'AnimeLover420',
      userResponse: await this.stateManager.retrieve('serverUsername')
    }))

    objects.push(createTextFieldObject({
      id: 'serverPassword',
      userReadableTitle: 'Password',
      placeholderText: 'Some Super Secret Password',
      userResponse: await this.stateManager.retrieve('serverPassword')
    }))

    return createUserForm({formElements: objects})
  }
}
