
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
}

// ... existing imports

export interface WelcomeButton {
    id: string;
    text: string;
    url: string;
}

export interface BotCommand {
    id: string;
    command: string;
    response: string;
    media?: { type: 'photo' | 'video'; url: string }[];
    buttons?: { id: string; text: string; url: string }[];
    showInMenu?: boolean;
}

export interface TelegramMenuCommand {
    id: string;
    command: string;
    description: string;
    enabled: boolean;
}

export interface TelegramProfileConfig {
    botName?: string;
    shortDescription?: string; // "About" text
    description?: string; // "What can this bot do?" text
    menuButtonUrl?: string; // URL for Mini App
    menuButtonText?: string;
    useMenuButton?: boolean;
}

export interface BotConfig {
    welcomeMessage: string;
    welcomeButtons?: WelcomeButton[];
    menuButtons: {
        products: string;
        cart: string;
        announcements: string;
        contactAdmin: string;
        adminPanel: string;
    };
    messages: {
        cartEmpty: string;
        cartHeader: string;
        checkoutPrompt: string;
        orderSuccess: string;
        contactPrompt: string;
        supportResponse: string;
        locationPrompt: string;
    };
    inlineButtons: {
        addToCart: string;
        checkout: string;
        clearCart: string;
        sendLocation: string;
        sendContact: string;
        cancel: string;
        skip: string;
        back: string;
    };
    customCommands?: BotCommand[];
    telegramMenuCommands?: TelegramMenuCommand[];
    telegramProfile?: TelegramProfileConfig;
}

export interface GradientStop {
    id: string;
    color: string;
    opacity: number;
    position: number;
}

export interface GradientConfig {
    type: 'linear' | 'radial' | 'conic';
    angle: number;
    stops: GradientStop[];
}

export interface StyleConfig {
    buttonRadius?: number;
    buttonPaddingX?: number;
    buttonPaddingY?: number;
    iconColor?: string;
    primaryColor?: string;
    logoHeight?: number;
    footerLinkColor?: string;
    cardHoverColor?: string;
    chatBlurColor?: string;
    productCardHoverColor?: string;
    darkModeColor?: string;
    cardBlur?: number;
    productLayout?: 'masonry' | 'grid' | 'list';
    chatButtonColor?: string;
    heroHeight?: number;
    navAlignment?: 'left' | 'center' | 'right'; 
    
    productCardBg?: string;
    productCardBackgroundGradient?: GradientConfig;
    productCardTextColor?: string;
    productPriceColor?: string;
    productCardBorderRadius?: number;
    productCardTextAlign?: 'left' | 'center' | 'right';
    
    // Advanced Product Card Settings
    productCardBlur?: number;
    productCardShadowColor?: string;
    productCardBorderWidth?: number;
    productCardBorderColor?: string;
    
    // Product Gallery Settings
    productGalleryAutoplay?: boolean;
    productGalleryInterval?: number; // Seconds

    // Product Button Settings
    addToCartText?: string;
    addedText?: string;
    addToCartBtnGradient?: GradientConfig;
    addedBtnGradient?: GradientConfig;
    addToCartBtnTextColor?: string;
    addedBtnTextColor?: string;

    // Category Button Styles
    categoryBtnColor?: string;
    categoryBtnActiveColor?: string;
    categoryBtnText?: string;
    categoryBtnActiveText?: string;

    productGrid?: {
        mobileCols: number;
        tabletCols: number;
        desktopCols: number;
        cardHeight: number; 
        gap: number;
    };

    productSection?: {
        backgroundGradient?: GradientConfig;
        backgroundColor?: string;
        paddingY?: number;
        titleColor?: string;
    };

    cardConfig?: {
        showQuantityControl?: boolean; 
        descriptionLines?: number; 
        titleSize?: number;
        categoryPosition?: 'top-left' | 'above-title' | 'below-title' | 'hover-overlay' | 'breadcrumb' | 'hidden';
        hideLikeButton?: boolean;
        imageHeight?: number; // 0 or undefined for auto (Pinterest style), >0 for fixed height
    };
}

export interface HeroMedia {
    id: string;
    type: 'image' | 'video';
    url: string; 
}

export interface HeroButton {
    id: string;
    text: string;
    url: string;
    variant: 'primary' | 'secondary' | 'outline' | 'glass';
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

export interface FaqItem {
    id: string;
    question: string;
    answer: string;
    isVisible: boolean;
}

export type FaqStyleVariant = 'simple' | 'boxed' | 'grid';

export interface FaqConfig {
    variant?: FaqStyleVariant;
    cardBlur?: number;
    cardBorderColor?: string;
    cardBorderGradient?: GradientConfig;
    cardBorderGradientStart?: string;
    cardBorderGradientEnd?: string;
    cardBorderWidth?: number;
    cardBgColor?: string;
    cardBgGradient?: GradientConfig;
    cardBgGradientStart?: string;
    cardBgGradientEnd?: string;
    questionColor?: string;
    answerColor?: string;
    iconColor?: string;
    iconBgColor?: string;
    iconBgGradient?: GradientConfig; 
    iconBorderGradient?: GradientConfig;
    iconBorderGradientStart?: string;
    iconBorderGradientEnd?: string;
    iconBorderWidth?: number; 
}

export interface FeatureActionButton {
    id: string;
    text: string;
    url: string;
    bgColor?: string;
    textColor?: string;
    icon?: string;
    iconColor?: string;
}

export type ImageDiffHandleStyle = 'circle-arrows' | 'circle' | 'square' | 'line';

export interface ImageDiffItem {
    id: string;
    beforeImage: string;
    afterImage: string;
    label?: string;
    description?: string;
    width?: string;
    height?: string;
    
    sliderColor?: string;
    sliderThickness?: number;
    handleColor?: string;
    
    handleStyle?: ImageDiffHandleStyle;
    hideHandle?: boolean;

    // Content properties
    textLayout?: 'top' | 'bottom' | 'overlay';
    titleColor?: string;
    descColor?: string;
    
    contentGradient?: GradientConfig;
    contentBgGradientStart?: string;
    contentBgGradientEnd?: string;
    
    titleGradient?: GradientConfig;
    titleGradientStart?: string;
    titleGradientEnd?: string;
    
    descGradient?: GradientConfig;
    descGradientStart?: string;
    descGradientEnd?: string;

    additionalText?: string;
    additionalTextColor?: string;
    buttons?: FeatureActionButton[];
}

export interface ImageDiffSectionConfig {
    isVisible?: boolean;
    title?: string;
    subtitle?: string;
    paddingY?: number;
    sectionGradient?: GradientConfig;
    cardBorderGradient?: GradientConfig;
    cardsGap?: number;
    cardsAlignment?: 'left' | 'center' | 'right';
    bgColor?: string;
    sectionBgGradientStart?: string;
    sectionBgGradientEnd?: string;
    bgDirection?: string;
    textColor?: string;
    textColorGradientStart?: string;
    textColorGradientEnd?: string;
    borderWidth?: number;
    borderRadius?: number;
    beforeLabel?: string;
    afterLabel?: string;
    // Slider props overrides
    interactionMode?: 'drag' | 'hover';
    sliderColor?: string;
    sliderThickness?: number;
    handleColor?: string;
    handleStyle?: ImageDiffHandleStyle;
    labelBgColor?: string;
    labelTextColor?: string;
    borderColor?: string;
    labelAlignment?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    
    // NEW FIELDS
    layoutMode?: 'flex' | 'grid';
    gridColumns?: number;
    hideHandle?: boolean;
}

export interface NavLink {
    id: string;
    text: string;
    url: string;
    type: 'internal' | 'external';
    pageId?: string;
}

export interface Treatment {
    id: string;
    name: string;
    price: number;
    currency: 'UZS' | 'USD';
    description?: string;
    category?: string;
    imageUrl?: string;
    images?: string[];
    condition?: 'new' | 'used';
    recommended?: boolean;
}

export interface CartItem extends Treatment {
    cartId: string;
    quantity: number;
}

export interface Category {
    id: string;
    name: string;
}

export interface Advertisement {
    id: string;
    imageUrl: string;
    title?: string;
    description?: string;
    buttonText?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    link?: string;
    isActive: boolean;
    createdAt: number;
}

export interface AdConfig {
    layoutMode?: 'carousel' | 'grid';
    autoplay?: boolean;
    interval?: number;
    showControls?: boolean;
    gap?: number;
    paddingX?: number;
    paddingY?: number;
    borderRadius?: number;
    height?: number;
    contentAlign?: 'left' | 'center' | 'right';
    gridColumns?: {
        mobile: number;
        tablet: number;
        desktop: number;
    };
    backgroundColor?: string;
    backgroundGradient?: GradientConfig;
    aspectRatio?: string;
}

export interface AdminUser {
    id: string;
    email: string;
    password?: string;
    name?: string;
    role: 'super_admin' | 'admin';
    isTwoFactorEnabled: boolean;
    twoFactorSecret?: string;
    permissions: {
        products: boolean;
        content: boolean;
        chat: boolean;
        settings: boolean;
        admins: boolean;
    };
}

export type SectionType = 'hero' | 'banner' | 'products' | 'features' | 'diff' | 'faq' | 'testimonials' | 'table';

export interface PageSection {
    id: string;
    type: SectionType;
    data: any; 
}

export interface Page {
    id: string;
    title: string;
    slug: string;
    sections: PageSection[];
}

export interface Order {
    id: string;
    date: number;
    itemsSummary: string;
    totalAmount: string;
    source: 'website' | 'bot';
    status: 'new' | 'completed' | 'cancelled' | 'fake';
    userId: string;
    userPhone: string;
    location?: string;
    items?: CartItem[];
}

export interface RateLimitState {
    dailyCount: number;
    lastResetTime: number;
    lastMessageTime: number;
    lastMessageText: string;
    spamScore: number;
}

export interface TelegramUser {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isBlocked?: boolean;
    isLoyal?: boolean;
    isPinned?: boolean;
    hasOrdered?: boolean;
    orders?: Order[];
    announcementsSeen?: string[];
    lastActive?: number;
    createdAt?: number;
    cartAddCount?: number;
    buttonClickCount?: number;
    source?: 'website' | 'bot';
    adminNotes?: string;
    spamBlockUntil?: number;
    rateLimit?: RateLimitState;
    likedProducts?: string[];
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: number;
    read: boolean;
    sessionId: string;
    telegramMessageId?: number;
    mediaUrl?: string;
    mediaType?: 'photo' | 'video' | 'audio' | 'document';
}

export interface ChatSession {
    id: string;
    lastMessage: string;
    lastMessageTime: number;
    unreadCount: number;
    blocked?: boolean;
    spamBlockUntil?: number;
    rateLimit?: RateLimitState;
    userName?: string;
}

export interface AnnouncementMedia {
    type: 'photo' | 'video';
    url: string;
}

export interface Announcement {
    id: string;
    caption: string;
    mediaItems: AnnouncementMedia[];
    inlineButtons?: { text: string, url: string }[];
    status: 'pending' | 'sending' | 'sent';
    createdAt: number;
    scheduledTime: number;
    sentTo: string[];
    frequency: 'once' | 'daily' | 'weekly' | 'monthly';
    targetDay?: number; 
    targetWeek?: number;
    maxRepeats?: number;
    currentRepeatCount: number;
    totalUsersCount?: number;
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

export interface TestimonialItem {
    id: string;
    name: string;
    text: string;
    role?: string;
    avatarUrl?: string;
    rating: number; // 1-5
    
    // Style overrides
    bgGradient?: GradientConfig;
    bgGradientStart?: string;
    bgGradientEnd?: string;
    textColor?: string;
    nameColor?: string;
    roleColor?: string;
    iconColor?: string;
    blurColor?: string;
    
    avatarSize?: number;
    reverseLayout?: boolean;
    fontFamily?: 'sans' | 'serif' | 'mono';
    width?: number;
    minHeight?: number;
    
    textSize?: number;
    nameSize?: number;
    roleSize?: number;
    starSize?: number;
    
    hideRating?: boolean;
    
    borderWidth?: number;
    borderGradient?: GradientConfig;
    borderGradientStart?: string;
    borderGradientEnd?: string;
}

export interface TestimonialsSectionConfig {
    sectionGradient?: GradientConfig;
    backgroundColor?: string;
    paddingY?: number;
    titleColor?: string;
    subtitleColor?: string;
}

export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    phone: string;
    imageUrl?: string;
    services?: { name: string; price: string }[];
}

export type ModalBlockType = 'text' | 'image' | 'table' | 'buttons';

export interface ModalButton {
    id: string;
    text: string;
    url: string;
    variant?: 'primary' | 'secondary' | 'outline';
    bgColor?: string;
    textColor?: string;
    icon?: string;
}

export interface TableRow {
    id: string;
    cells: string[];
}

export interface ModalBlock {
    id: string;
    type: ModalBlockType;
    title?: string;
    titleColor?: string;
    titleSize?: string;
    content?: string; // HTML for text
    textColor?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    
    url?: string; // For image
    imageWidth?: string;
    imageHeight?: string;
    objectFit?: 'cover' | 'contain';
    borderRadius?: number;
    
    headers?: string[]; // For table
    tableRows?: TableRow[];
    tableVariant?: 'simple' | 'striped' | 'bordered';
    tableHeaderBg?: string;
    tableHeaderTextColor?: string;
    tableHeaderGradient?: GradientConfig;
    tableRowBg?: string;
    tableBorderColor?: string;
    
    buttons?: ModalButton[]; // For buttons block
    
    blockBgColor?: string;
    blockPadding?: number;
}

export interface FeatureCard {
    id: string;
    title: string;
    description: string;
    imageUrl?: string; 
    width?: number;
    height?: number;
    
    // Card Appearance
    cardGradient?: GradientConfig;
    contentBgStart?: string;
    contentBgEnd?: string;
    titleColor?: string;
    descColor?: string;
    titleGradientStart?: string;
    titleGradientEnd?: string;
    
    cardBorderGradient?: GradientConfig;
    cardBorderWidth?: number;
    
    hideImageOnCard?: boolean;
    hideTitleOnCard?: boolean; // If true, title is overlay
    overlayOpacity?: number;
    
    // Overlay specific
    caption?: string;
    captionColor?: string;
    captionSize?: number;
    captionAlign?: 'left' | 'center' | 'right';
    captionDescription?: string;
    captionDescriptionColor?: string;
    captionDescriptionSize?: number;
    
    additionalText?: string;
    additionalTextColor?: string;
    
    // Interaction
    clickAction?: 'modal' | 'link' | 'none';
    linkUrl?: string; // if link
    linkText?: string;
    
    // Modal Config
    modalLayout?: 'overlay' | 'hero' | 'split-left' | 'split-right';
    modalImageUrl?: string;
    modalImageFit?: 'cover' | 'contain';
    hideModalImage?: boolean;
    hideModalTitle?: boolean;
    hideModalDescription?: boolean;
    
    modalBackgroundGradient?: GradientConfig;
    modalContentGradient?: GradientConfig;
    
    modalBlocks?: ModalBlock[];
    
    // Legacy support 
    cardButtons?: ModalButton[]; 
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

export interface TableSectionConfig {
    title?: string;
    description?: string;
    headers: string[];
    rows: TableRow[];
    
    variant?: 'simple' | 'striped' | 'bordered';
    
    headerBgGradientStart?: string;
    headerBgGradientEnd?: string;
    headerTextColor?: string;
    rowBgColor?: string;
    rowTextColor?: string;
    borderColor?: string;
    stripeColor?: string;
    
    borderStyle?: 'solid' | 'dashed' | 'dotted';
    borderWidth?: number;
    borderRadius?: number;
    borderGradientStart?: string;
    borderGradientEnd?: string;
    
    fontFamily?: 'sans' | 'serif' | 'mono';
    titleSize?: number;
    titleColor?: string;
    titleAlign?: 'left' | 'center' | 'right';
    descColor?: string;
    
    headerFontSize?: number;
    rowFontSize?: number;
}

export interface ProductCondition {
    // legacy type
}

export interface SiteConfig {
    id: string;
    headline: string;
    subheadline: string;
    gradientStart: string;
    gradientEnd: string;
    gradientStartOpacity?: number;
    gradientEndOpacity?: number;
    subheadlineFont?: string;
    subheadlineColor?: string;
    headlineColor?: string;
    logoText?: string;
    logoUrl?: string;
    darkModeColor?: string;
    showHomeLink?: boolean; // New Flag
    
    textGradientStart?: string;
    textGradientEnd?: string;
    heroBackgroundGradient?: GradientConfig;
    heroTextGradient?: GradientConfig;
    
    customItems?: any[]; 
    customCardsGradient?: GradientConfig;
    customCardsPosition?: 'left' | 'center' | 'right';
    
    heroMedia?: HeroMedia[];
    
    // Sections Data
    homeSectionOrder?: SectionType[];
    
    bannerAds?: Advertisement[];
    adConfig?: AdConfig;
    
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
    
    navLinks?: NavLink[];
    pages?: Page[];
    
    itemsPerPage?: number;
    
    telegram?: {
        botToken: string;
        adminId: string;
        broadcastBotToken?: string;
    };
    
    footer?: {
        description: string;
        copyright: string;
        poweredBy: string;
        links: FooterLink[];
        socials: FooterSocial[];
    };
    
    style?: StyleConfig;
    
    botConfig?: BotConfig;
    
    conditionConfig?: any;
    twoFactorIssuer?: string;
    firebaseConfig?: FirebaseConfig;
}
