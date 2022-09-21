export default {

  Header: {
    title: 'eDiplomas Wallet',
    description: 'A Digital Wallet for diplomas transcripts'
  },

  Footer: {
    services: 'Services',
    info: 'Information',
    contact: 'Contact',
    web: 'Web',
    email: 'E-mail for Organizations and HEIs',
    participatingInstitutions: 'Participating Institutions',
    signatureVerification: 'Signature Verification',
    diplomaCheck: 'Ex-officio Degree Check',
    termsOfUse: 'Terms of Use',
    revocation: 'Authorization Revocation',
    templateHandlingApp: 'Degree Template Administration Service',
    developersGuide: 'Documentation'
  },

  Login: {
    header: 'eDiplomas Wallet',
    description1: 'Your digital wallet for the university degrees and lifelong learning certifications',
    description2: 'Insert your secret passphrase to login',
    buttonLogin: 'Login',
    buttonRegister: 'Register',
    buttonImport: 'Import existing wallet',
  },

  Register: {
    step1: {
      title: 'Step 1',
      description1: 'To create your wallet, you must first provide a token from the EBSI Onboarding Service (EOS) page to prove that you are not a robot',
      buttonEOS: 'Visit EOS to get token',
      description2: 'Paste your token here',
      token: 'token',
      buttonToken: 'Submit token'
    },
    step2: {
      title: 'Step 2',
      description1: 'At this step, you must provide a secure passphrase to protect your wallet',
      description2: 'Choose a passphrase',
      passphrase: 'passphrase',
      buttonBack: 'Back',
      buttonRegister: 'Register'
    },
    loading: 'Registering Wallet'
  },

  Import: {
    header: 'Import Wallet',
    buttonChooseFile: 'Choose File',
    passphrase: 'passphrase',
    buttonImport: 'Import wallet',
    success: 'Success',
    successText: 'Successfully imported wallet.',
    error: 'Error',
    errorText: 'Failed to import wallet.',
    buttonTryAgain: 'Try again',
    buttonReturnLogin: 'Return to login page'
  },

  Export: {
    buttonExport: 'Export Wallet',
    confirmExport: 'Confirm Wallet Export',
    passphrasePrompt: 'Please enter your password'
  },

  Wallet: {
    tab1: {
      title: 'My Credentials',
      verifiableIdentifiers: 'Verifiable Identifiers',
      verifiableCredentials: 'Verifiable Credentials',
      emptyVID: "You don't have any Verifiable IDs yet",
      emptyVC: "You don't have any Verifiable Credentials yet",
      vidPrompt: 'Need an EBSI Verifiable ID?',
      vidButton: 'Request VID from Gov.gr'
    },
    tab2: {
      title: 'VP Audit Records',
    },
    tab3: {
      title: 'Settings',
      dataHub: 'Store my Verifiable Credentials into the ID Data Hub',
    },
    tab4: {
      title: 'Connected Services',
      vid: 'Request a VID from the Greek EBSI Verifiable ID provider portal',
      diplomaHeader: 'Receive a Verifiable Diploma in just a few clicks',
      diplomaDesc: 'Must be a Greek Higher Education Institute Graduate',
      verifyHeader: 'Verify diplomas issued by Greek Higher Education Institutes in a privacy preserving way',
      verifyDesc: 'Available for specified authorized parties from the public and private sector'
    },
    tab5: {
      logout: 'Logout'
    }
  },

  Audit: {
    header: 'Verifiable Presentation Audit Records',
    range: 'Range at which the VPs are issued',
    from: 'From',
    to: 'To',
    filter: 'Select VC types filter',
    validAt: 'Show Presentations which are still valid at',
    nonExpired: 'Show non-expired',
    presentationId: 'Presentation ID',
    issuedAt: 'Issued at'
  },

  VpCard: {
    presentationId: 'Presentation ID',
    validity: 'Validity',
    issuedAt: 'Issued at',
    issuanceDate: 'Issuance Date',
    expirationDate: 'Expiration date',
    details: 'Details',
    containedTypes: 'Contained VC Types'
  },

  Authz: {
    title: 'Select Verifiable IDs',
    description1: 'In this step you can select the Verifiable ID credentials you want to present on',
    description2: 'in order to prove your identity',
    titleNoCred: 'Authorize connection with your Wallet',
    descriptionNoCred1: 'Do you authorize',
    descriptionNoCred2: 'to connect with your wallet?',
    buttonBack: 'Back',
    buttonAuthorize: 'Authorize'
  },

  Present: {
    title: 'Select which Verifiable Credentials you want to present to',
    exp: 'Set an expiration date for this presentation',
    buttonBack: 'Back',
    buttonAuthorize: 'Authorize'
  },

  ShortVc: {
    verifiableId: 'Verifiable ID',
    verifiableCredential: 'Verifiable Credential',
    diploma: 'Diploma'
  },

  RequestVc: {
    title: 'VC Received',
    description: 'Your VC has been received from your Wallet',
    error: 'There has been a problem with your VC',
    loading: 'Wait for credentials to be received',
    done: 'View your Credentials'
  },


///////////////////////////////////////////////////////////
  Graduate: {
    graduate: 'Graduate',
    step1: {
      title: 'Step 1',
      text: 'Digital Wallet Connection'
    },
    step2: {
      title: 'Step 2',
      text: 'Organization Selection'
    },
    step3: {
      title: 'Step 3',
      text: 'Entity Authorization'
    },
    step4: {
      title: 'Step 4',
      text: 'Verification Report'
    },
    // Step 1
    title1: 'Login with Digital Wallet',
    paragraph1: 'Your VID will be requested from your wallet',
    button1: 'Login with Digital Wallet',
    tinyprint1: 'Your VID will be requested from your wallet',
    // Step 2
    title2: 'Who is allowed to access my diplomas?',
    paragraph2:
      'Select the name of the organization/entity which you want to grant access to information regarding your university degree(s).',
    placeholder2: 'Organization Selection...',
    organization: 'Selected Organization:',
    back: 'Back',
    continue: 'Continue',
    // Step3
    title3: 'Log into eDiplomas',
    paragraph3: 'By continuing to the next step the following will take place:',
    bullet1: 'Redirecting and logging into eDiplomas Digital Wallet.',
    bullet2: 'Selection of the data that will be shared.',
    // Step 4
    title4: 'Verification Report',
    paragraph4:
      `The verification process has been completed and the result is stated below.
       In the case of successful verification, the presentation has already been send to the authorized organization.`,
    successTitle: 'Success',
    successDescription: 'Your presentation has been successfully validated and is available for review',
    failureTitle: 'Failure',
    failureDescription: 'Your presentation has failed validation',
    walletRedirection: 'Return to Digital Wallet',
    forgotToLogOutTaxis: 'Forgot to log out of TAXISNet',
    wantToLogOutTaxis: 'To log out follow the following link',
    taxisLogout: 'Log out of TAXISNet',
    warning1:
      'For your security, log out of TAXISNet if you have completed your work on this workstation.',
    warning2:
      'It is possible that you will remain logged in other applications that use login through TAXISNet service.',
    token: 'Code',
    QRCode: 'QR Code',
    show: 'Show',
    hide: 'Hide',
    duration: 'Duration',
    codeCopied: 'Code copied'
  },
  Landing: {
    category1: 'I am an owner of a University degree',
    paragraph1:
      'I want to grant access to information about my University degrees',
    category2: 'I am an organization representative',
    paragraph2: 'I want to gain access to information about University degrees',
    continue: 'Continue',
    showMore: 'I want to know more',
    backToTop: 'Back to top',
    ImGrad: 'I am an owner of a University degree',
    ImOrg: 'I am an organization representative',
    continueAs: 'Continue As',
    logout: 'Logout',
    contents: {
      title: 'Contents',
      bullet1: 'Overview',
      bullet2: 'Graduates',
      bullet3: 'Organizations'
    },
    Cards: {
      title1: 'Security',
      paragraph1:
        "By using digital signing and cryptography technologies, the authenticity of the degree's information is ensured and the access is given only to authorized clients.",
      title2: 'Ease',
      paragraph2:
        'After just a couple of clicks and the use of TAXISNet credentials, the user authorizes a third-party to draw information about the degrees they own.',
      title3: 'Interoperability',
      paragraph3:
        'Clients with candidate data submission applications of their own, can connect to eDiplomas through the use of well defined standards.'
    },
    title1: 'Overview',
    paragraph3:
      'Through eDiplomas, the citizen and owner of degrees issued by greek HEIs is able, by using their TAXISNet account, to authorize a client (public Institution or company) to receive information regarding their degrees. Citizens ',
    paragraph3extra:
      'explicitly select the data to be shared and the client that will receive it',
    paragraph4:
      "The platform uses technologies which ensure the protection of private data as well as the authenticity of the degrees' information. By making the submission and degree verification processes simple and fast for the owner as well as the client, it is, at the same time, attempted to eliminate the phenomenon of fake and counterfeit degrees.",
    title2: 'Graduates',
    paragraph5:
      "Ediplomas has been developed by the national HEIs in collaboration with the Greek Universities Network (GUnet). It is constantly evolving and advancing, by making use of the technical expertise and digital infrastructure of the country's Institutions.",
    title3: 'Organizations',
    paragraph6:
      "Avoid the issuing of degree copies and the delivery - shipment to third parties (f.e. future employers) processes. Log in, by using your TAXISNet credentials and choose easily and fast who can have access and to which parts of your degrees' information.",
    paragraph7:
      "Register to the platform, by using the organisation's Taxpayer Indentification Number (TIN), authorize specific members/associates TINs who will have access to the platform under the organisation's name and will gain access to information regarding degrees they are interested in, in a fast and reliable way.",
    presentations: 'Learn more about ediplomas',
    eDiplomas: 'eDiplomas',
    presentationFilename: 'Presentation',
    demoFilename: 'Demo',
    documentationName: 'Documentation',
    uoaAnnouncement: 'UoA Announcement',
    priviledge2019: 'PRIViLEDGE Project Blog 11/2019',
    priviledge2020: 'PRIViLEDGE Project Blog 11/2020',
    videoEBSI: 'EBSI Multi University Pilot 04/03/2022',
    blueprintsInfo: 'eDiplomas Blueprints 10/01/2022',
    jadesInfo: 'JAdES Plugtest 11/2021 - 01/2022',
    articleEBSI:
      'EBSI: Cypriot Citizen’s journey as a Greek University graduate 12/2021',
    articlesTitle: 'Articles & News',
    presentationsTitle: 'Presentations',
    presentationGunet: 'GUnet Technical Meeting 6/2019',
    presentationEUNIS: 'EUNIS 2020 Virtual Helsinki 6/2020',
    interactivePresentation: 'Interactive Presentation of eDiplomas 4/2022',
    presentationΗμερίδα: 'eDiplomas Chania Crete Meeting (Greek) 11/2020',
    blueprintsNewsHeader:
      'eDiplomas Blueprints platform for template registration (10/01/2022 - 28/02/2022)',
    blueprintsNews1: 'All Greek Universities are invited to submit to',
    blueprintsNews2:
      'all the bachelor or equivalent diploma templates that have been issued since 1/1/2010.'
  },
  Organisation: {
    organisation: 'Organization',
    verificationRequests: {
      verificationRequests: 'Verification Requests',
      id: 'Request ID',
      firstName: 'First Name',
      familyName: 'Family Name'
    },
    credentialCards: {
      title: 'Content',
      description: 'You can find the credentials contained in the presentation below',
      empty: 'Verifiable Presentation is empty',
      europass: 'Degree',
      verifiableId: 'Verifiable ID',
      verifiableCredential: 'Verifiable Credential',
      diploma: {
        issuerBlueprint: 'Issuer Blueprint',
        qualificationLevel: 'Qualification Level',
        degreeTitle: 'Degree Title',
        gradeValue: 'Grade Value',
        gradeDescription: 'Grade Description',
        issuanceDate: 'Issuance Date',
      },
      vid: {
        name: 'Name',
        surname: 'Surname',
        dateOfBirth: 'Date of Birth',
        tin: 'TIN',
      },
      vc: {
        type: 'Type',
        issuer: 'Credential Issuer',
        issuanceDate: 'Issuance Date',
        expirationDate: 'Expiration Date',
        id: 'Credential ID',
        did: 'DID'
      },
    },
    taxis: {
      taxisLogin: 'Log in with TAXISNet',
      accessGranted:
        'Access to eDiplomas services for organisations is granted to:',
      registeredEntity:
        'designated representatives of the organisation regarding each service (only for registered organisations)',
      taxisUsers:
        'any citizen, if the holder of the degree has selected the authorization option dedicated to "TAXISNet Users"',
      accessComment:
        'Access is granted through the TAXISNet account of the representative/individual.',
      doLogin: 'Log in'
    },
    tokenEntry: {
      diplomasByAuthorization: 'Degrees through Authorization',
      paragraph1point1:
        "In order to access information regarding a citizen's university degree, you have to become authorized by them. Then the citizen will receive a ",
      paragraph1point2: 'code',
      paragraph1point3: ', which you have to enter in the form below.',
      label: 'Code',
      placeholder1: "Graduate's Code...",
      searchButton: 'Search',
      errorMessageHeader: 'Oops!',
      errorMessageInvalidOrExpired:
        'The code you enter is either invalid or expired',
      errorMessageGeneral: 'Something went wrong. Try again later.',
      signatureCopied: 'Signature copied'
    },
    logout: {
      logout: 'Logout',
      haveLoggedOut: 'You have logged out of eDiplomas.',
      wantToLogOutTaxis:
        'If you want to log out of TAXISNet follow the link below',
      taxisLogout: 'Log out of TAXISNet',
      warning1:
        'For your security, log out of TAXISNet if you have completed your work on this workstation.',
      warning2:
        'It is possible that you will remain logged in for other applications that use login through TAXISNet service.',

      backHome: 'Return to Homepage'
    },
    taxisLogout: {
      logout: 'Log out of TAXISNet',
      haveLoggedOut: 'You have successfully logged out of TAXISNet.',
      goBackHome: 'Return to Homepage'
    },
    menu: {
      diplomasByAuthorization: 'Degrees through Authorization',
      getAccessToDegreesInfo:
        'Get access to information regarding the degrees you are authorized for by',
      signatureVerification: 'Signature Validity Verification',
      verifySignatureValidityDiplomasIssuedBy:
        "Verify the digital signatures' validity of degrees issued by",
      ediplomas: 'eDiplomas',
      diplomaCheck: 'Ex-Officio Degree Check',
      verifyDegreeAuthenticity:
        'Verify the authenticity of degree copies that have been submitted to your entity and have not been issued by',
      onlyPublicSector: '(only for public-sector entities)'
    },
    menuGraduate: {
      authorizeDiploma: 'Degree Authorization',
      newAuthorizationInfo:
        'Authorize access to information regarding your degree.',
      viewDiplomas: 'Degrees',
      controlDiplomas: 'Search and download the certification of your degree.',
      viewAuthorizations: 'Authorization Archive',
      controlAuthorizations:
        'See the active authorizations and the archive of the authorizations you have given.'
    },
    check: {
      inspect: 'Ex-Officio Degree Check',
      inspectDescription:
        'By using the ex-officio degree check service, you will be able to verify the validity of degree copies you have in your possession, if you are authorized by the Institution in charge.',
      byFilling: 'By filling the',
      institution: 'Insitution',
      ssn: 'Social Security Number (SSN)',
      the: 'the',
      andOtherYouCanGet:
        'as well as various data regarding the degree, you can search for it in the platform and receive the',
      signed: 'signed',
      digital: 'digital',
      editionFrom: 'version issued by ',
      change: 'Edit',
      institutionSelect: 'Institution Selection',
      department: 'Department',
      level: 'Level',
      fullname: 'Fullname',
      date: 'Date',
      firstname: 'First Name',
      lastname: 'Last Name',
      wrongDate: 'Invalid Date',
      theLaw:
        'I am aware that any search operation is subject to legal oversight according to the General Data Protection Regulation (EU) 2016/679. In this case, each search must be documented by title information deposited to the organization',
      search: 'Search',
      continue: 'Continue',
      searchResults: 'Search Results',
      notFound: 'There are no results for the above data.',
      note: 'Note',
      maybeNotSubmittedAt:
        'It is possible that the degree you searched for has not been registered to',
      byInstitution: 'by the corresponding Institution yet',
      info: 'Information about the Institutions and the degrees available in',
      canBeFoundAt: 'can be found here:',
      gradInfo: 'Degree/Graduate Data',
      dateInfo: 'Date of graduation or completion',
      notAuthorized:
        'You are not authorized to perform ex-officio checks in the chosen department',
      bachelor: 'Bachelor',
      master: 'Master',
      doctorate: 'Doctorate',
      option: 'Option'
    },
    loginError: {
      loginFailed: 'Login Failed!',
      taxisSuccessFulButTin: 'Login to TAXISNet was successful, but your TIN ',
      notAuthorized: 'does not match to an user authorized',
      forEdiplomasUse: 'to use eDiplomas',
      backHome: 'Return to Homepage'
    },
    degree: 'Degree',
    degrees: 'Degrees',
    print: 'Print',
    pdfVersion: 'Download PDF',
    close: 'Close',
    copy: 'Copy',
    Qr: 'QR Code',
    Text: 'Text',
    navigateToMenu: 'Navigate to the menu',
    dateFollowsFormat: 'The date follows the format DD:MM:YYYY'
  },
  AdoptionRates: {
    participatingInstitutions: 'Participating Institutions',
    participatingInstitution: 'Participating Institution',
    registeredDiplomas: 'Registered Diplomas',
    comments: 'Comments',
    contact: 'Contact',
    requestServing: 'Request Support',
    signedPdf: 'Signed PDF',
    yes: 'Yes',
    no: 'No',
    diplomas: {
      undergraduate: 'Bachelor',
      postgraduate: 'Master',
      doctorate: 'Doctoral'
    },
    contactInfo: {
      web: 'Web',
      telephone: 'Telephone',
      email: 'E-mail'
    }
  },
  GeneralError: {
    oops: 'Oops!',
    somethingWentWrong: 'Something went wrong',
    tryLater: 'Try again later.',
    goBackHome: 'Return to Homepage',
    tryAgain: 'Try Again'
  },
  diplomaFields: {
    gradeValue: 'Grade (Value)',
    gradeDescription: 'Grade (Description)',
    issuerInstitution: 'Issuing Institution',
    issuerUnit: 'Issuing Unit',
    level: 'Level of Education',
    title: 'Degree Title',
    validFrom: 'Date of Completion',
    dateIssued: 'Date of Graduation',
    firstNameEl: 'First Name',
    lastNameEl: 'Last Name',
    birthDate: 'Date of Birth',
    fatherNameEl: "Father's Name",
    motherNameEl: "Mother's Name",
    signature: 'Signature',
    signedAt: 'Timestamp',
    signedFor: 'Signed for'
  },
  educationalLevels: {
    6: "6 - Bachelor's or equivalent level",
    64: '64 - Academic',
    641: '641 - Insufficient for level completion',
    645: '645 - First degree (3–4 years)',
    646: '646 - Long first degree (more than 4 years)',
    647: "647 - Second or further degree (following a bachelor's or equivalent programme)",
    65: '65 - Professional',
    651: '651 - Insufficient for level completion',
    655: '655 - First degree (3–4 years)',
    656: '656 - Long first degree (more than 4 years)',
    657: "657 - Second or further degree (following a bachelor's or equivalent programme)",
    66: '66 - Orientation unspecified',
    661: '661 - Insufficient for level completion',
    665: '665 - First degree (3–4 years)',
    666: '666 - Long first degree (more than 4 years)',
    667: "667 - Second or further degree (following a bachelor's or equivalent programme)",
    7: "7 - Master's or equivalent level",
    74: '74 - Academic',
    741: '741 - Insufficient for level completion',
    746: '746 - Long first degree (at least 5 years)',
    747: "747 - Second or further degree (following a bachelor's or equivalent programme)",
    748: "748 - Second or further degree (following a master's or equivalent programme)",
    75: '75 - Professional',
    751: '751 - Insufficient for level completion',
    756: '756 - Long first degree (at least 5 years)',
    757: "757 - Second or further degree (following a bachelor's or equivalent programme)",
    758: "758 - Second or further degree (following a master's or equivalent programme)",
    76: '76 - Orientation unspecified',
    761: '761 - Insufficient for level completion',
    766: '766 - Long first degree (at least 5 years)',
    767: "767 - Second or further degree (following a bachelor's or equivalent programme)",
    768: "768 - Second or further degree (following a master's or equivalent programme) ",
    8: 'Doctoral or equivalent'
  },
  Verifier: {
    signatureVerification: 'Signature Verification',
    verify: 'Verify Siganture',
    invalidSignature: 'The digital signature you entered is not valid!',
    errorHeader: 'Unable to verify signature',
    enterSignature:
      "Please enter the degree's digital signature you want to verify in the form below",
    signature: "Degree's Digital Signature"
  },
  TermsOfUse: {
    termsOfUse: 'Terms of Use',
    termsParagraph1:
      'GUnet takes all the measures necessary for ensuring the correct functioning of the service. GUnet and the participating HEIs bear no responsibility for any damage (direct or indirect, positive or deponent) occurred to the user from the use or inability to use, from delays during the use, mistakes or oversights, connection interruptions, damages of the power supply network or other factors.',
    termsParagraph2:
      "Logging into the service takes place by the use of each user's personal credentials. The user that wishes to use the said service, is responsible for every data submission or authorization that they perform.",
    termsParagraph3:
      'The user that wishes to use the said service, oughts to provide real, precise, valid and complete information during its use.',
    termsParagraph4:
      "The information that refers to degree's data and appears in the service is provided through direct connection to the corresponding HEIs' information systems. GUnet takes all the measures necessary for ensuring the precision of the data appearing in the service, however GUnet is responsible only for the reappearance of the information and is under no circumstances responsible for its content, neither is in charge for providing clarifications or explanations of any sort on the said data. The participating HEIs who provide the primary pieces of information are in charge of the previous tasks.",
    termsParagraph5:
      "All the data provided by the user is not being used for any other cause other than the one described by this service. The precision of the data submitted by the user are their own responsibility and any damage (direct or indirect, positive or deponent) derived from the submission of imprecise data, holds themselves accountable and is under no circumstances GUNet's or the participating HEI's responsibility.",
    termsParagraph6:
      "The service does not store degree's data nor user's personal information and credentials, apart from the Social Security Number (SSN) which serves as the basic asset for the implementation of the service's functionality. This asset is stored only temporarily, is encrypted and is in the user's convenience to ask for its deletion, as long as they proceed to the revocation of their authorizations granted to clients.",
    termsParagraph7Part1:
      "The service uses only session cookies for the user's access to the application, through TAXISNet credentials. Cookies are small text files which are stored in each user's hard drive and do not contain personal data for the identification of the users of the web nor they acquire knowledge about any of the documents or files on the user's computer. These cookies are automatically deleted after the logout from the service. The user can",
    termsParagraph7Part2: 'adjust',
    termsParagraph7Part3:
      'their Web navigation program in such a way that it either notifies them for the use of "cookies" in specific applications or it does not allow accepting the use of "cookies" in any case. Noting that in case the that user does not approve the use of "cookies" for their identification, their connection to the service through their TAXISNet credentials is not possible.'
  },
  Documentation: {
    documentation: 'Documentation',
    developers: 'Developers',
    connectionThirdParties: "Third-party applications' connection to eDiplomas",
    institutions: 'Institutions',
    institutionIntegration: 'Institution integration into eDiplomas',
    descriptionParagraph1:
      "Ediplomas is a new online platform for the verification of HEI degrees ownership. Through eDiplomas, the citizen and owner of degrees issued by greek HEIs is able, by using their TAXISnet account, to authorize a client (public Institution or company) to receive information regarding their degrees. The platform uses technologies which ensure the protection of private data as well as the authenticity of the degrees' information. By making the submission and degree verification processes simple and fast for the owner as well as the client, it is, at the same time, attempted to eliminate the phenomenon of the fake and counterfeit degrees.",
    descriptionParagraph2:
      'Ediplomas is consisted by separate information systems, each of them offering a specific service and providing the corresponding interface for connecting to third-parties.',
    organisations: 'Organisations',
    organisationRegistration:
      'Organisation registration for the use of eDiplomas services',
    backToTop: 'Back to Top',
    navbar: {
      contents: 'Contents',
      documentation: 'Home',
      developers: 'Developers',
      institutions: 'Institutions',
      organisations: 'Organisations',
      oauthIntegrationGuide:
        'Integration using OAuth2 for third-party services',
      description: 'Description',
      quickStart: 'Quick Start',
      orgClients: 'Organisations and Clients',
      scopes: 'Scopes',
      clientRegistration: 'Client Registration',
      oauth2: 'OAuth2',
      accessToDegree: 'Access to Degrees',
      customClientAuthFlowDesc: 'Authorization for custom clients',
      authProcess: 'Authorization Process',
      tokenRenewal: 'Token Renewal',
      degreeTemplateCreation: 'Degree Template Creation',
      generally: 'Overview',
      indicativeExample: 'Example',
      gradDataInsert: 'Graduate Information Entry',
      throughView: 'Through View',
      schema: 'Schema',
      fields: 'Fields',
      throughAPI: 'Through API',
      indicativeExamples: 'Examples',
      requestService: 'Request support',
      ediplomasSupportAccess: 'Access to Ediplomas Support',
      eduPersonEntitlementExamples: 'eduPersonEntitlement Examples',
      notValidValuesExamples: 'Examples of Invalid Values',
      introduction: 'Introduction',
      basicConcepts: 'Basic Concepts',
      orgExOfficio: 'Entity Registration for Ex-Officio checks',
      orgClientNoApp: 'Entity Registration for ediplomas.gr',
      orgClientWithApp: 'Entity Registration for OAuth2'
    }
  },
  Jades: {
    home: 'Home',
    news: 'News'
  },
  Footer: {
    services: 'Services',
    info: 'Information',
    contact: 'Contact',
    web: 'Web',
    email: 'E-mail for Organizations and HEIs',
    participatingInstitutions: 'Participating Institutions',
    signatureVerification: 'Signature Verification',
    diplomaCheck: 'Ex-officio Degree Check',
    termsOfUse: 'Terms of Use',
    revocation: 'Authorization Revocation',
    templateHandlingApp: 'Degree Template Administration Service',
    developersGuide: 'Documentation'
  }
};
