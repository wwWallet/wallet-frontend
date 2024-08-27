import { tests } from './ec';

// Define tests in ec module so that we don't have to export private members to
// access them here in the test module
tests();
