
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

export interface SupabaseConfig {
    url: string;
    anonKey: string;
    bucketName?: string;
}

export interface SystemCheckResult {
    id: string;
    name: string;
    status: 'ok' | 'error' | 'warning';
    message: string;
    fix?: string;
}

export interface WelcomeButton {
    id: string;
    text: string;
    url: string;
}

export interface BotCommand {
    id: string;
    command: string;
    response: string;
    description?: string;
    media?: { type: 'photo' | 'video'; url: string }[];
    buttons?: { id: string; text: string; url: string; variant?: string; bgColor?: string; textColor?: string }[];
    showInMenu?: boolean;
}

export interface Treatment {
    id: string;
    name: string;
    price: number;
    currency?: 'UZS' | 'USD';
    category?: string;
    description?: string;
    imageUrl?: string;
    images?: string[];
    condition?: 'new' | 'used';
    recommended?: boolean;
    createdAt?: number;
}

export interface Category {
    id: string;
    name: string;
}

export interface CartItem extends Treatment {
    cartId: string;
    quantity: number;
}

export interface Order {
    id: string;
    date: number;
    itemsSummary: string;
    totalAmount: string;
    source: 'website' | 'bot';
    status: 'new' | 'completed' | 'cancelled' | 'fake';
    userId?: string;
    userPhone?: string;
    location?: string;
    items?: CartItem[];
}

export interface TelegramUser {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    language?: string;
    isLoyal?: boolean;
    isPinned?: boolean;
    lastActive?: number;
    orders?: Order[];
    adminNotes?: string;
    source?: 'website' | 'bot';
    likedProducts?: string[];
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: number;
    read?: boolean;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video' | 'audio' | 'document';
    telegramMessageId?: number;
}

export interface ChatSession {
    id: string;
    userId: string;
    userName?: string;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    blocked?: boolean;
    spamBlockUntil?: number;
}

export interface AdminUser {
    id: string;
    email: string;
    password?: string;
    name?: string;
    role?: 'super_admin' | 'admin';
    permissions: {
        products: boolean;
        content: boolean;
        chat: boolean;
        settings: boolean;
        admins: boolean;
    };
    isTwoFactorEnabled?: boolean;
    twoFactorSecret?: string;
}

export interface Advertisement {
    id: string;
    imageUrl: string;
    title?: string;
    description?: string;
    buttonText?: string;
    link?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    isActive?: boolean;
    createdAt?: number;
}

export interface HeroMedia {
    id: string;
    type: 'image' | 'video';
    url: string;
}

export interface GradientStop {
    id: string;
    color: string;
    opacity: number;
    position: number;
}

export interface GradientConfig {
    type: 'linear' | 'radial' | 'conic';
    angle?: number;
    stops: GradientStop[];
}

export interface CustomInfoItem {
    id: string;
    icon: string;
    text: string;
    label: string;
    isVisible: boolean;
    link?: string;
    color?: string;
}

export interface FeatureCard {
    id: string;
    title: string;
    description: string;
    imageUrl?: string;
    linkText?: string;
    linkUrl?: string;
    
    width?: number;
    height?: number;
    
    // Appearance
    cardGradient?: GradientConfig;
    contentBgStart?: string;
    contentBgEnd?: string;
    titleColor?: string;
    titleGradientStart?: string;
    titleGradientEnd?: string;
    descColor?: string;
    
    cardBorderGradient?: GradientConfig;
    cardBorderWidth?: number;
    
    // Overlay/Caption
    hideTitleOnCard?: boolean;
    hideImageOnCard?: boolean;
    overlayOpacity?: number;
    caption?: string;
    captionAlign?: 'left' | 'center' | 'right';
    captionColor?: string;
    captionSize?: number;
    captionDescription?: string;
    captionDescriptionColor?: string;
    captionDescriptionSize?: number;
    
    additionalText?: string;
    additionalTextColor?: string;
    
    // Modal
    clickAction?: 'modal' | 'none';
    hideModalTitle?: boolean;
    hideModalImage?: boolean;
    hideModalDescription?: boolean;
    modalLayout?: 'overlay' | 'hero' | 'split-left' | 'split-right';
    modalImageUrl?: string;
    modalImageFit?: 'cover' | 'contain';
    modalBackgroundGradient?: GradientConfig;
    modalContentGradient?: GradientConfig;
    
    modalBlocks?: ModalBlock[];
    cardButtons?: any[]; // legacy
}

export interface ModalButton {
    id: string;
    text: string;
    url: string;
    icon?: string;
    bgColor?: string;
    textColor?: string;
    iconColor?: string;
}

export interface TableRow {
    id: string;
    cells: string[];
}

export interface ModalBlock {
    id: string;
    type: ModalBlockType;
    title?: string;
    content?: string; // for text (HTML)
    url?: string; // for image
    
    // Styling
    blockBgColor?: string;
    blockPadding?: number;
    textAlign?: 'left' | 'center' | 'right';
    titleColor?: string;
    titleSize?: string;
    textColor?: string;
    fontSize?: string;
    
    // Image specific
    imageWidth?: string;
    imageHeight?: string;
    objectFit?: 'cover' | 'contain';
    borderRadius?: number;
    
    // Table specific
    headers?: string[];
    tableRows?: TableRow[];
    tableVariant?: 'simple' | 'striped' | 'bordered';
    tableHeaderBg?: string;
    tableHeaderGradient?: GradientConfig;
    tableHeaderTextColor?: string;
    tableRowBg?: string;
    tableBorderColor?: string;
    
    // Buttons specific
    buttons?: ModalButton[];
}

export type ModalBlockType = 'text' | 'image' | 'table' | 'buttons';

export interface NavLink {
    id: string;
    text: string;
    url: string;
    type: 'internal' | 'external';
    pageId?: string;
}

export interface FooterLink {
    id: string;
    text: string;
    url: string;
}

export interface FooterSocial {
    id: string;
    platform: 'telegram' | 'instagram' | 'facebook' | 'youtube';
    url: string;
}

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    isVisible: boolean;
}

export interface TestimonialItem {
    id: string;
    name: string;
    role?: string;
    text: string;
    avatarUrl?: string;
    rating: number;
    hideRating?: boolean;
    
    // Styling overrides
    bgGradient?: GradientConfig;
    bgGradientStart?: string;
    bgGradientEnd?: string;
    textColor?: string;
    nameColor?: string;
    roleColor?: string;
    iconColor?: string;
    blurColor?: string;
    
    borderGradient?: GradientConfig;
    borderGradientStart?: string;
    borderGradientEnd?: string;
    borderWidth?: number;
    
    avatarSize?: number;
    reverseLayout?: boolean;
    fontFamily?: 'sans' | 'serif' | 'mono';
    width?: number;
    minHeight?: number;
    
    textSize?: number;
    nameSize?: number;
    roleSize?: number;
    starSize?: number;
}

export interface ImageDiffItem {
    id: string;
    beforeImage: string;
    afterImage: string;
    label?: string;
    description?: string;
    
    // Slider styling
    sliderColor?: string;
    sliderThickness?: number;
    handleColor?: string;
    handleStyle?: 'circle-arrows' | 'circle' | 'square' | 'line';
    hideHandle?: boolean;
    
    // Text styling
    textLayout?: 'top' | 'bottom' | 'overlay';
    titleColor?: string;
    titleGradient?: GradientConfig;
    descColor?: string;
    descGradient?: GradientConfig;
    
    // Content box styling
    contentGradient?: GradientConfig;
    contentBgGradientStart?: string;
    contentBgGradientEnd?: string;
    
    additionalText?: string;
    additionalTextColor?: string;
    
    buttons?: FeatureActionButton[];
    height?: string; // css height e.g. "400px" or "auto"
}

export interface FeatureActionButton {
    id: string;
    text: string;
    url: string;
    icon?: string;
    bgColor?: string;
    textColor?: string;
    iconColor?: string;
}

export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    imageUrl?: string;
    phone: string;
    services?: { name: string; price: string }[];
}

export interface AdConfig {
    autoplay?: boolean;
    interval?: number;
    showControls?: boolean;
    layoutMode?: 'carousel' | 'grid';
    gap?: number;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    height?: number;
    contentAlign?: 'left' | 'center' | 'right';
    backgroundGradient?: GradientConfig;
    backgroundColor?: string;
    aspectRatio?: string;
    gridColumns?: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
}

export type FaqStyleVariant = 'simple' | 'boxed' | 'grid';

export interface FaqConfig {
    variant?: FaqStyleVariant;
    cardBgGradient?: GradientConfig;
    cardBgGradientStart?: string;
    cardBgGradientEnd?: string;
    cardBgColor?: string;
    cardBorderGradient?: GradientConfig;
    cardBorderGradientStart?: string;
    cardBorderGradientEnd?: string;
    cardBorderColor?: string;
    cardBorderWidth?: number;
    cardBlur?: number;
    
    questionColor?: string;
    answerColor?: string;
    
    iconColor?: string;
    iconBgGradient?: GradientConfig;
    iconBgColor?: string;
    iconBorderGradient?: GradientConfig;
    iconBorderGradientStart?: string;
    iconBorderGradientEnd?: string;
    iconBorderWidth?: number;
}

export interface TestimonialsSectionConfig {
    sectionGradient?: GradientConfig;
    backgroundColor?: string;
    paddingY?: number;
    titleColor?: string;
    subtitleColor?: string;
}

export interface FeatureSectionConfig {
    layoutMode?: 'carousel' | 'grid';
    cardsGap?: number;
    paddingY?: number;
    cardsAlignment?: 'left' | 'center' | 'right';
    sectionGradient?: GradientConfig;
    bgGradientStart?: string;
    bgGradientEnd?: string;
}

export interface ImageDiffSectionConfig {
    isVisible?: boolean;
    title?: string;
    subtitle?: string;
    bgColor?: string;
    textColor?: string;
    
    paddingY?: number;
    sectionGradient?: GradientConfig;
    sectionBgGradientStart?: string;
    sectionBgGradientEnd?: string;
    bgDirection?: string;
    
    cardBorderGradient?: GradientConfig;
    borderWidth?: number;
    borderRadius?: number;
    
    cardsGap?: number;
    cardsAlignment?: 'left' | 'center' | 'right';
    
    beforeLabel?: string;
    afterLabel?: string;
    
    // Global overrides
    layoutMode?: 'flex' | 'grid';
    gridColumns?: number;
    hideHandle?: boolean;
    handleStyle?: 'circle-arrows' | 'circle' | 'square' | 'line';
    labelAlignment?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    
    // Styling Defaults
    sliderColor?: string;
    sliderThickness?: number;
    handleColor?: string;
    labelBgColor?: string;
    labelTextColor?: string;
    borderColor?: string;
}

export interface TableSectionConfig {
    title?: string;
    description?: string;
    headers?: string[];
    rows?: TableRow[];
    variant?: 'simple' | 'striped' | 'bordered';
    
    fontFamily?: 'sans' | 'serif' | 'mono';
    titleSize?: number;
    titleColor?: string;
    titleAlign?: 'left' | 'center' | 'right';
    descColor?: string;
    
    headerBgGradientStart?: string;
    headerBgGradientEnd?: string;
    headerTextColor?: string;
    headerFontSize?: number;
    
    rowBgColor?: string;
    rowTextColor?: string;
    rowFontSize?: number;
    stripeColor?: string;
    
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderWidth?: number;
    borderRadius?: number;
    borderColor?: string;
    borderGradientStart?: string;
    borderGradientEnd?: string;
}

export interface PageSection {
    id: string;
    type: SectionType;
    data: {
        heroConfig?: SiteConfig;
        featureCards?: FeatureCard[];
        featureSectionConfig?: FeatureSectionConfig;
        ads?: Advertisement[];
        adConfig?: AdConfig;
        diffItems?: ImageDiffItem[];
        diffConfig?: ImageDiffSectionConfig;
        faqItems?: FaqItem[];
        faqTitle?: string;
        faqSubtitle?: string;
        faqConfig?: FaqConfig;
        testimonials?: TestimonialItem[];
        testimonialsTitle?: string;
        testimonialsSubtitle?: string;
        testimonialsConfig?: TestimonialsSectionConfig;
        tableConfig?: TableSectionConfig;
    };
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    sections: PageSection[];
}

export interface TelegramMenuCommand {
    id: string;
    command: string;
    description: string;
    enabled: boolean;
}

export interface TelegramProfileConfig {
    botName?: string;
    shortDescription?: string;
    description?: string;
}

export interface StyleConfig {
    logoHeight?: number;
    navAlignment?: 'left' | 'center' | 'right';
    primaryColor?: string;
    buttonRadius?: number;
    buttonPaddingX?: number;
    buttonPaddingY?: number;
    iconColor?: string;
    footerLinkColor?: string;
    cardHoverColor?: string;
    chatButtonColor?: string;
    chatBlurColor?: string;
    
    // Product Card Specific
    productLayout?: 'masonry' | 'grid' | 'list';
    productCardBg?: string;
    productCardBackgroundGradient?: GradientConfig;
    productCardTextColor?: string;
    productCardBorderRadius?: number;
    productCardBorderWidth?: number;
    productCardBorderColor?: string;
    productCardShadowColor?: string;
    productCardBlur?: number;
    productCardHoverColor?: string; // used for shadow/border on hover
    productCardTextAlign?: 'left' | 'center' | 'right';
    productPriceColor?: string;
    
    productGalleryAutoplay?: boolean;
    productGalleryInterval?: number;
    
    cardConfig?: {
        showQuantityControl?: boolean;
        hideLikeButton?: boolean;
        descriptionLines?: number;
        titleSize?: number;
        categoryPosition?: 'top-left' | 'hover-overlay' | 'breadcrumb' | 'above-title' | 'below-title' | 'hidden';
        imageHeight?: number; // if 0, auto/aspect
    };
    
    // Product Section
    productSection?: {
        backgroundColor?: string;
        backgroundGradient?: GradientConfig;
        titleColor?: string;
    };
    
    // Button specific
    addToCartText?: string;
    addedText?: string;
    addToCartBtnGradient?: GradientConfig;
    addedBtnGradient?: GradientConfig;
    addToCartBtnTextColor?: string;
    addedBtnTextColor?: string;
    
    categoryBtnColor?: string;
    categoryBtnActiveColor?: string;
    categoryBtnText?: string;
    categoryBtnActiveText?: string;
    
    darkModeColor?: string;
    heroHeight?: number;
}

export interface BotConfig {
    welcomeMessage?: string;
    welcomeButtons?: WelcomeButton[];
    menuButtons?: Record<string, string>;
    messages?: Record<string, string>;
    inlineButtons?: Record<string, string>;
    customCommands?: BotCommand[];
    telegramMenuCommands?: TelegramMenuCommand[];
    telegramProfile?: TelegramProfileConfig;
}

export interface SiteConfig {
    id: string;
    headline: string;
    subheadline: string;
    gradientStart: string;
    gradientEnd: string;
    gradientStartOpacity?: number;
    gradientEndOpacity?: number;
    heroBackgroundGradient?: GradientConfig;
    heroTextGradient?: GradientConfig;
    subheadlineFont?: string;
    headlineColor?: string;
    subheadlineColor?: string;
    textGradientStart?: string;
    textGradientEnd?: string;
    
    logoUrl?: string;
    logoText?: string;
    
    customItems?: CustomInfoItem[];
    customCardsGradient?: GradientConfig;
    customCardsPosition?: 'left' | 'center' | 'right';
    
    heroMedia?: HeroMedia[];
    
    darkModeColor?: string;
    showHomeLink?: boolean;
    itemsPerPage?: number;
    
    homeSectionOrder?: SectionType[];
    
    featureCards?: FeatureCard[];
    featureSectionConfig?: FeatureSectionConfig;
    
    imageDiffs?: ImageDiffItem[];
    diffSectionConfig?: ImageDiffSectionConfig;
    
    faqItems?: FaqItem[];
    faqTitle?: string;
    faqSubtitle?: string;
    faqConfig?: FaqConfig;
    
    testimonials?: TestimonialItem[];
    testimonialsTitle?: string;
    testimonialsSubtitle?: string;
    testimonialsConfig?: TestimonialsSectionConfig;
    
    tableConfig?: TableSectionConfig;
    
    bannerAds?: Advertisement[];
    adConfig?: AdConfig;
    
    footer?: {
        description?: string;
        copyright?: string;
        poweredBy?: string;
        links: FooterLink[];
        socials: FooterSocial[];
    };
    
    telegram?: {
        botToken: string;
        adminId: string;
    };
    
    style?: StyleConfig;
    
    pages?: Page[];
    navLinks?: NavLink[];
    
    conditionConfig?: any; // kept for legacy
    botConfig?: BotConfig;
    
    twoFactorIssuer?: string;
    firebaseConfig?: FirebaseConfig;
    supabaseConfig?: SupabaseConfig;
}

export type SectionType = 'hero' | 'banner' | 'products' | 'features' | 'diff' | 'faq' | 'testimonials' | 'table';
export type ProductCondition = 'new' | 'used';
export type BotState = 'start' | 'waiting_for_name' | 'waiting_for_phone' | 'waiting_for_location' | 'admin_chat';
export type BotStep = 'idle' | 'name' | 'phone' | 'location' | 'comment';

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: number;
    views: number;
    imageUrl?: string;
}

export interface AnnouncementMedia {
    type: 'photo' | 'video';
    fileId: string;
    url?: string;
}

export interface RateLimitState {
    count: number;
    firstRequest: number;
    blockedUntil: number;
}