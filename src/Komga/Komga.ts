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
  FormObject,
  SourceInfo,
  RequestHeaders,
  TagSection,
  UserForm,
  MangaTile,
  SourceMenu,
  SourceMenuItemType
} from "paperback-extensions-common"

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

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]

// Number of items requested for paged requests
const PAGE_SIZE = 40

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
    let page : number = metadata?.page ?? 0

    let paramsList = [`page=${page}`, `size=${PAGE_SIZE}`]

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

    // If no series were returned we are on the last page
    metadata = tiles.length === 0 ? undefined : {page: page + 1}

    return createPagedResults({
      results: tiles,
      metadata
    })
  }

  async getHomePageSections(sectionCallback: (section: HomeSection) => void): Promise<void> {
    
    const komgaAPI = await this.getKomgaAPI()
    const authorizationString = await this.getAuthorizationString()

    const sections = [
      {
        request: createRequestObject({
          url: `${komgaAPI}/series/new`,
          param: "?page=0&size=20",
          method: "GET",
          headers: {authorization: authorizationString}
        }),
        section: createHomeSection({
            id: 'new',
            title: 'Recently added series',
            view_more: true,
        }),
    },
    {
      request: createRequestObject({
        url: `${komgaAPI}/series/updated`,
        param: "?page=0&size=20",
        method: "GET",
        headers: {authorization: authorizationString}
      }),
      section: createHomeSection({
          id: 'updated',
          title: 'Recently updated series',
          view_more: true,
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

  async getViewMoreItems(homepageSectionId: string, metadata: any): Promise<PagedResults | null> {

    const komgaAPI = await this.getKomgaAPI()
    const authorizationString = await this.getAuthorizationString()
    let page: number = metadata?.page ?? 0

    const request = createRequestObject({
      url: `${komgaAPI}/series/${homepageSectionId}`,
      param: `?page=${page}&size=${PAGE_SIZE}`,
      method: "GET",
      headers: {authorization: authorizationString},
    })

    const data = await this.requestManager.schedule(request, 1)
    const result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

    let tiles: MangaTile[] = []
    for (let serie of result.content) {
      tiles.push(createMangaTile({
        id: serie.id,
        title: createIconText({ text: serie.metadata.title }),
        image: `${komgaAPI}/series/${serie.id}/thumbnail`,
        subtitleText: createIconText({ text: "id: " + serie.id }),
      }))
    }

    // If no series were returned we are on the last page
    metadata = tiles.length === 0 ? undefined : {page: page + 1}
    
    return createPagedResults({
        results: tiles,
        metadata: metadata
    })
  }

  async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {

    const komgaAPI = await this.getKomgaAPI()
    const authorizationString = await this.getAuthorizationString()

    // We make requests of PAGE_SIZE titles to `series/updated/` until we got every titles 
    // or we got a title which `lastModified` metadata is older than `time`
    let page = 0
    let foundIds: string[] = []
    let loadMore = true

    while (loadMore) {

      const request = createRequestObject({
        url: `${komgaAPI}/series/updated/`,
        param: `?page=${page}&size=${PAGE_SIZE}`,
        method: "GET",
        headers: {authorization: authorizationString}
      })

      const data = await this.requestManager.schedule(request, 1)
      let result = typeof data.data === "string" ? JSON.parse(data.data) : data.data

      for (let serie of result.content) {
        let serieUpdated = new Date(serie.metadata.lastModified)

        if (serieUpdated >= time) {
          if (ids.includes(serie)) {
              foundIds.push(serie)
          }
        }
        else {
          loadMore = false
          break
        }
      }

      // If no series were returned we are on the last page
      if (result.content.length === 0){
        loadMore = false
      }

      page = page + 1

      if (foundIds.length > 0) {
        mangaUpdatesFoundCallback(createMangaUpdates({
          ids: foundIds
        }))
      }
    }

  }

  /*
  getMangaShareUrl(mangaId: string) {
    return `${KOMGA_API_DOMAIN}/series/${mangaId}`
  }
  */

  async getSourceMenu(): Promise<SourceMenu> {
    return Promise.resolve(createSourceMenu({
       items: [
         createSourceMenuItem({
           id: "serverSettings",
           label: "Server Settings",
           type: SourceMenuItemType.FORM
         })
       ]
    }))
  }

  async getSourceMenuItemForm(itemId: string): Promise<UserForm> {
    let objects: FormObject[] = [
      createTextFieldObject({
        id: 'serverAddress',
        label: 'Server URL',
        placeholderText: 'http://127.0.0.1:8080',
        value: (await this.stateManager.retrieve('serverAddress')).value
      }),
      createTextFieldObject({
        id: 'serverUsername',
        label: 'Username',
        placeholderText: 'AnimeLover420',
        value: (await this.stateManager.retrieve('serverUsername')).value
      }),
      createTextFieldObject({
        id: 'serverPassword',
        label: 'Password',
        placeholderText: 'Some Super Secret Password',
        value: (await this.stateManager.retrieve('serverPassword')).value
      })
    ]

    return createUserForm({formElements: objects})
  }

  async submitSourceMenuItemForm(itemId: string, form: any) {
    var promises: Promise<void>[] = []

    Object.keys(form).forEach(key => {
      promises.push(this.stateManager.store(key, {value: form[key]}))
    })

    await Promise.all(promises)
  }
}
